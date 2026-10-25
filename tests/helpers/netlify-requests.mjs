import assert from 'node:assert/strict'
import handler from '../../.netlify/functions-internal/server/main.mjs'

// Run in a child process so the compiled app owns and closes its connection pool
// before the parent shuts down the temporary Postgres server.
const request = (path, options) => handler(new Request(`https://secret-santa.example${path}`, options))
const post = body => request('/api/draws', { method: 'POST', headers: { 'content-type': 'application/json' }, body })
const names = ['Alicia', 'Ben', 'Cara', 'Daniel', 'Emma', 'Finn', 'Grace', 'Hugo']
assert.equal((await post('{')).status, 400)
assert.equal((await post('')).status, 400)
assert.equal((await post(JSON.stringify({ names: names.slice(1) }))).status, 400)
assert.equal((await post(JSON.stringify({ names: ['ben', ...names.slice(1)] }))).status, 400)
assert.equal((await post(JSON.stringify({ names, title: 'a'.repeat(9000) }))).status, 413)
// Check byte length rather than character count for Unicode payloads too.
assert.equal((await post(JSON.stringify({ names, title: '🎁'.repeat(2100) }))).status, 413)
const created = await post(JSON.stringify({ names }))
const draw = await created.json()
assert.equal(created.status, 200, JSON.stringify(draw))
assert.match(created.headers.get('cache-control'), /no-store/)
assert.equal(created.headers.get('referrer-policy'), 'no-referrer')
const adminResponse = await request(`/api/draws/${draw.id}`, { headers: { authorization: `Bearer ${draw.adminKey}` } })
assert.equal(adminResponse.status, 200)
const admin = await adminResponse.json()
assert.deepEqual(admin.participants.map(person => person.name), names)
assert.equal('recipient' in admin.participants[0], false)
const recipients = await Promise.all(admin.participants.map(async person => {
  const headers = { authorization: `Bearer ${person.token}` }
  const invitation = await request('/api/picker', { headers })
  assert.equal(invitation.status, 200)
  assert.equal((await invitation.json()).opened, false)
  const result = await request('/api/picker/reveal', { method: 'POST', headers })
  assert.equal(result.status, 200)
  const revealed = await result.json()
  assert.notEqual(revealed.recipient, person.name)
  const again = await request('/api/picker/reveal', { method: 'POST', headers })
  assert.deepEqual(await again.json(), revealed)
  return revealed.recipient
}))
assert.deepEqual(recipients.sort(), [...names].sort())
const after = await request(`/api/draws/${draw.id}`, { headers: { authorization: `Bearer ${draw.adminKey}` } })
assert.ok((await after.json()).participants.every(person => person.opened))
