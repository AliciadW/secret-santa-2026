import assert from 'node:assert/strict'
import test from 'node:test'
import { neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/pglite'
import { DrawStore, getDrawStore } from '../server/utils/store'
import { DrawError } from '../server/utils/draw'
import { createTestPostgres } from './helpers/postgres.mjs'

test('Netlify serverless HTTP lookups and reveals use Neon v1 query calls', async () => {
  const database = await createTestPostgres()
  const previousFetch = neonConfig.fetchFunction
  const previousURL = process.env.NETLIFY_DB_URL
  const previousDriver = process.env.NETLIFY_DB_DRIVER
  let requests = 0
  try {
    // Creation already uses a transaction over the pool. Seed via the Postgres
    // driver, then exercise the real Netlify/Neon HTTP driver for reads/writes.
    const writer = new DrawStore(drizzle({ client: database }))
    const names = ['Alicia', 'Ben', 'Cara', 'Daniel', 'Emma', 'Finn', 'Grace', 'Hugo']
    const draw = await writer.create({ names })
    process.env.NETLIFY_DB_DRIVER = 'serverless'
    process.env.NETLIFY_DB_URL = 'postgresql://test:test@database.example/test'
    neonConfig.fetchFunction = async (_url, options) => {
      // Only replace transport: real Neon parameter encoding and response
      // parsing run against the exact migration in a real Postgres engine.
      requests++
      const { query, params } = JSON.parse(options!.body as string)
      const result = await database.query<unknown[]>(query, params, { rowMode: 'array' })
      return new Response(JSON.stringify({
        fields: result.fields,
        rows: result.rows.map(row => row.map(value => value === null ? null : value instanceof Date ? value.toISOString() : String(value))),
        rowCount: result.affectedRows ?? result.rows.length,
      }), { headers: { 'content-type': 'application/json' } })
    }
    const store = getDrawStore()
    const admin = await store.organiser(draw.id, draw.adminKey)
    assert.deepEqual(admin.participants.map(person => person.name), names)
    assert.ok(admin.participants.every(person => !person.opened))
    await assert.rejects(store.organiser(draw.id, 'wrong-key'), (error: unknown) => error instanceof DrawError && error.statusCode === 404)
    await assert.rejects(store.organiser('missing-draw', draw.adminKey), (error: unknown) => error instanceof DrawError && error.statusCode === 404)
    const recipients = []
    for (const person of admin.participants) {
      const invitation = await store.invitation(person.token)
      assert.equal(invitation.name, person.name)
      assert.equal(invitation.opened, false)
      const revealed = await store.reveal(person.token)
      assert.notEqual(revealed.recipient, person.name)
      assert.deepEqual(await store.reveal(person.token), revealed)
      assert.equal((await store.invitation(person.token)).opened, true)
      recipients.push(revealed.recipient)
    }
    assert.deepEqual(recipients.sort(), [...names].sort())
    assert.ok((await store.organiser(draw.id, draw.adminKey)).participants.every(person => person.opened))
    assert.ok(requests > 0, 'Lookups must exercise the HTTP transport')
  } finally {
    neonConfig.fetchFunction = previousFetch
    if (previousURL === undefined) delete process.env.NETLIFY_DB_URL
    else process.env.NETLIFY_DB_URL = previousURL
    if (previousDriver === undefined) delete process.env.NETLIFY_DB_DRIVER
    else process.env.NETLIFY_DB_DRIVER = previousDriver
    await database.close()
  }
})
