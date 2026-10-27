import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:net'
import test from 'node:test'
import { PGLiteSocketServer } from '@electric-sql/pglite-socket'
import { createTestPostgres } from './helpers/postgres.mjs'

test('production app serves pages, enforces credentials, and reveals one stable unique name per invitation', { timeout: 30000 }, async () => {
  const database = await createTestPostgres()
  const postgres = new PGLiteSocketServer({ db: database, host: '127.0.0.1', port: 0, maxConnections: 20 })
  await postgres.start()
  const reserve = createServer()
  reserve.listen(0, '127.0.0.1')
  await once(reserve, 'listening')
  const port = reserve.address().port
  await new Promise(resolve => reserve.close(resolve))
  const server = spawn(process.execPath, ['.output/server/index.mjs'], {
    env: {
      ...process.env,
      NITRO_HOST: '127.0.0.1',
      NITRO_PORT: String(port),
      NETLIFY_DB_URL: `postgresql://postgres:postgres@${postgres.getServerConn()}/postgres?sslmode=disable`,
      NETLIFY_DB_DRIVER: 'server',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const base = `http://127.0.0.1:${port}`
  let output = ''
  server.stderr.on('data', chunk => { output += chunk })
  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Server did not start: ${output}`)), 10000)
      server.once('error', reject)
      server.once('exit', code => { clearTimeout(timeout); reject(new Error(`Server exited (${code}): ${output}`)) })
      server.stdout.on('data', chunk => {
        output += chunk
        if (output.includes('Listening on')) { clearTimeout(timeout); resolve() }
      })
    })
    const home = await fetch(base)
    assert.equal(home.status, 200)
    assert.match(await home.text(), /Who’s in the circle\?/)
    assert.match(home.headers.get('cache-control'), /no-store/)
    assert.equal(home.headers.get('referrer-policy'), 'no-referrer')
    const names = ['Alicia', 'Ben', 'Cara', 'Daniel', 'Emma', 'Finn', 'Grace', 'Hugo']
    const postDraw = body => fetch(`${base}/api/draws`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    assert.equal((await postDraw({ names: names.slice(0, 1) })).status, 400)
    assert.equal((await postDraw({ names: ['ben', ...names.slice(1)] })).status, 400)
    assert.equal((await postDraw({ names, title: 'a'.repeat(9000) })).status, 413)
    const response = await postDraw({ names })
    assert.equal(response.status, 200, `Draw creation failed. Server output: ${output}`)
    const draw = await response.json()
    const auth = token => ({ authorization: `Bearer ${token}` })
    const adminPath = `${base}/api/draws/${draw.id}`
    assert.equal((await fetch(adminPath)).status, 401)
    assert.equal((await fetch(adminPath, { headers: auth('a'.repeat(43)) })).status, 404)
    const adminResponse = await fetch(adminPath, { headers: auth(draw.adminKey) })
    assert.equal(adminResponse.status, 200)
    const admin = await adminResponse.json()
    assert.equal(admin.participants.length, names.length)
    assert.equal(JSON.stringify(admin).includes('recipient'), false)
    assert.equal((await fetch(`${base}/organise/${draw.id}?key=${draw.adminKey}`)).status, 200)
    assert.equal((await fetch(`${base}/pick?name=Alicia&token=${admin.participants[0].token}`)).status, 200)
    assert.equal((await fetch(`${base}/api/picker?name=Alicia`)).status, 401)
    assert.equal((await fetch(`${base}/api/picker`, { headers: auth(draw.adminKey) })).status, 404)
    const reveals = await Promise.all(admin.participants.map(async person => {
      const headers = auth(person.token)
      const invitation = await (await fetch(`${base}/api/picker?name=SomeoneElse`, { headers })).json()
      assert.equal(invitation.name, person.name)
      assert.equal('recipient' in invitation, false)
      assert.equal(invitation.opened, false)
      const results = await Promise.all(Array.from({ length: 4 }, async () => {
        const result = await fetch(`${base}/api/picker/reveal`, { method: 'POST', headers })
        assert.equal(result.status, 200)
        return result.json()
      }))
      assert.ok(results.every(result => result.recipient === results[0].recipient))
      assert.equal(results[0].name, person.name)
      assert.notEqual(results[0].recipient, person.name)
      return results[0].recipient
    }))
    assert.deepEqual(reveals.sort(), [...names].sort())
    const after = await (await fetch(adminPath, { headers: auth(draw.adminKey) })).json()
    assert.ok(after.participants.every(person => person.opened))
  } finally {
    const exited = once(server, 'exit')
    server.kill('SIGTERM')
    await exited
    await postgres.stop()
    await database.close()
  }
})
