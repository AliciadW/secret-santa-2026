import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test, { after, before, beforeEach } from 'node:test'
import type { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { DrawStore } from '../server/utils/store'
import { createTestPostgres } from './helpers/postgres.mjs'

const names = ['Alicia', 'Ben', 'Cara', 'Daniel', 'Emma', 'Finn', 'Grace', 'Hugo']
let client: PGlite
let store: DrawStore

before(async () => {
  client = await createTestPostgres()
  store = new DrawStore(drizzle({ client }))
})
beforeEach(async () => { await client.exec('TRUNCATE participants, draws') })
after(async () => { await client?.close() })

test('every invitation reveals one unique recipient, and repeating never redraws', async () => {
  const draw = await store.create({ names })
  const admin = await store.organiser(draw.id, draw.adminKey)
  assert.deepEqual(admin.participants.map(person => person.name), names)
  const recipients = []
  for (const person of admin.participants) {
    assert.deepEqual(await store.invitation(person.token), { name: person.name, title: 'Our Secret Santa', opened: false })
    assert.equal('recipient' in person, false)
    const result = await store.reveal(person.token)
    recipients.push(result.recipient)
    assert.notEqual(result.recipient, person.name)
    assert.deepEqual(await store.reveal(person.token), result)
    assert.equal((await store.invitation(person.token)).opened, true)
  }
  assert.deepEqual(recipients.sort(), [...names].sort())
  assert.ok((await store.organiser(draw.id, draw.adminKey)).participants.every(person => person.opened))
})

test('invalid tokens and organiser credentials cannot access a draw', async () => {
  const first = await store.create({ names })
  const second = await store.create({ names })
  await assert.rejects(store.organiser(first.id, second.adminKey))
  await assert.rejects(store.organiser(first.id, ''))
  await assert.rejects(store.organiser('missing', first.adminKey))
  await assert.rejects(store.invitation('made-up-token'))
  await assert.rejects(store.reveal(first.adminKey))
  const firstTokens = new Set((await store.organiser(first.id, first.adminKey)).participants.map(person => person.token))
  assert.ok((await store.organiser(second.id, second.adminKey)).participants.every(person => !firstTokens.has(person.token)))
})

test('concurrent reveals preserve both the recipient and the first opened timestamp', async () => {
  const draw = await store.create({ names })
  const person = (await store.organiser(draw.id, draw.adminKey)).participants[0]!
  const first = await store.reveal(person.token)
  const before = await client.query('SELECT opened_at FROM participants WHERE token = $1', [person.token])
  const results = await Promise.all(Array.from({ length: 12 }, () => store.reveal(person.token)))
  assert.ok(results.every(result => result.recipient === first.recipient))
  const after = await client.query('SELECT opened_at FROM participants WHERE token = $1', [person.token])
  assert.deepEqual(after.rows, before.rows)
})

test('database constraints reject duplicate names, tokens, recipients, self picks, and recipients from another draw', async () => {
  const first = await store.create({ names })
  const second = await store.create({ names })
  const rows = await client.query<{ id: string; name: string; token: string; recipient_id: string }>('SELECT * FROM participants WHERE draw_id = $1 ORDER BY position', [first.id])
  const [a, b] = rows.rows
  const expectConstraint = (statement: string, values: string[], code: string) => assert.rejects(client.query(statement, values), (error: any) => error.code === code)
  await expectConstraint('UPDATE participants SET name = $1 WHERE id = $2', [a!.name, b!.id], '23505')
  await expectConstraint('UPDATE participants SET token = $1 WHERE id = $2', [a!.token, b!.id], '23505')
  const otherGiver = rows.rows.find(person => person.id !== a!.id && person.id !== a!.recipient_id)!
  await expectConstraint('UPDATE participants SET recipient_id = $1 WHERE id = $2', [a!.recipient_id, otherGiver.id], '23505')
  await expectConstraint('UPDATE participants SET recipient_id = id WHERE id = $1', [a!.id], '23514')
  const foreign = await client.query<{ id: string }>('SELECT id FROM participants WHERE draw_id = $1 LIMIT 1', [second.id])
  await expectConstraint('UPDATE participants SET recipient_id = $1 WHERE id = $2', [foreign.rows[0]!.id, a!.id], '23503')
})

test('a failed participant insert rolls back the entire draw transaction', async (t) => {
  await client.exec(`
    CREATE FUNCTION reject_test_participant() RETURNS trigger AS $$
      BEGIN RAISE EXCEPTION 'Test participant insert failure'; END;
    $$ LANGUAGE plpgsql;
    CREATE TRIGGER reject_test_participant BEFORE INSERT ON participants
      FOR EACH ROW EXECUTE FUNCTION reject_test_participant();
  `)
  t.after(async () => { await client.exec('DROP TRIGGER reject_test_participant ON participants; DROP FUNCTION reject_test_participant()') })
  await assert.rejects(store.create({ names }))
  assert.deepEqual((await client.query('SELECT count(*)::int AS count FROM draws')).rows, [{ count: 0 }])
  assert.deepEqual((await client.query('SELECT count(*)::int AS count FROM participants')).rows, [{ count: 0 }])
})

test('draws, private links, recipients and revealed status survive a database restart', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'secret-santa-postgres-'))
  let persisted = await createTestPostgres(directory)
  try {
    let persistedStore = new DrawStore(drizzle({ client: persisted }))
    const draw = await persistedStore.create({ names, title: 'Christmas crew' })
    const before = await persistedStore.organiser(draw.id, draw.adminKey)
    const token = before.participants[0]!.token
    const revealed = await persistedStore.reveal(token)
    await persisted.close()
    // Reopen the Postgres data directory without applying the migration again.
    const { PGlite } = await import('@electric-sql/pglite')
    persisted = await PGlite.create(directory)
    persistedStore = new DrawStore(drizzle({ client: persisted }))
    const after = await persistedStore.organiser(draw.id, draw.adminKey)
    assert.equal(after.title, 'Christmas crew')
    assert.deepEqual(after.participants.map(person => person.token), before.participants.map(person => person.token))
    assert.equal(after.participants[0]!.opened, true)
    assert.equal(after.participants[1]!.opened, false)
    assert.deepEqual(await persistedStore.reveal(token), revealed)
  } finally { await persisted.close(); await rm(directory, { recursive: true, force: true }) }
})
