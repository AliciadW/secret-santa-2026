import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { DrawStore } from '../server/utils/store'

const names = ['Alicia', 'Ben', 'Cara', 'Daniel', 'Emma', 'Finn', 'Grace', 'Hugo']

test('every invitation reveals only its assigned recipient, and repeating never redraws', () => {
  const store = new DrawStore(':memory:')
  try {
    const draw = store.create({ names })
    const admin = store.organiser(draw.id, draw.adminKey)
    assert.equal(admin.participants.length, 8)
    const recipients = []
    for (const person of admin.participants) {
      assert.deepEqual(store.invitation(person.token), { name: person.name, title: 'Our Secret Santa', opened: false })
      assert.equal('recipient' in person, false)
      const result = store.reveal(person.token)
      recipients.push(result.recipient)
      assert.notEqual(result.recipient, person.name)
      assert.deepEqual(store.reveal(person.token), result)
      assert.equal(store.invitation(person.token).opened, true)
    }
    assert.deepEqual(recipients.sort(), [...names].sort())
    assert.ok(store.organiser(draw.id, draw.adminKey).participants.every(person => person.opened))
  } finally { store.close() }
})

test('invalid tokens and organiser credentials cannot access a draw', () => {
  const store = new DrawStore(':memory:')
  try {
    const first = store.create({ names })
    const second = store.create({ names })
    assert.throws(() => store.organiser(first.id, second.adminKey))
    assert.throws(() => store.organiser(first.id, ''))
    assert.throws(() => store.organiser('missing', first.adminKey))
    assert.throws(() => store.invitation('made-up-token'))
    assert.throws(() => store.reveal(first.adminKey))
    const firstTokens = new Set(store.organiser(first.id, first.adminKey).participants.map(person => person.token))
    assert.ok(store.organiser(second.id, second.adminKey).participants.every(person => !firstTokens.has(person.token)))
  } finally { store.close() }
})

test('draws, private links, recipients and revealed status survive a server restart', () => {
  const directory = mkdtempSync(join(tmpdir(), 'secret-santa-test-'))
  const path = join(directory, 'draw.sqlite')
  let store = new DrawStore(path)
  try {
    const draw = store.create({ names, title: 'Christmas crew' })
    const before = store.organiser(draw.id, draw.adminKey)
    const token = before.participants[0]!.token
    const revealed = store.reveal(token)
    store.close()
    store = new DrawStore(path)
    const after = store.organiser(draw.id, draw.adminKey)
    assert.equal(after.title, 'Christmas crew')
    assert.deepEqual(after.participants.map(person => person.token), before.participants.map(person => person.token))
    assert.equal(after.participants[0]!.opened, true)
    assert.equal(after.participants[1]!.opened, false)
    assert.deepEqual(store.reveal(token), revealed)
  } finally { store.close(); rmSync(directory, { recursive: true, force: true }) }
})
