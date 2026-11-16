import assert from 'node:assert/strict'
import test from 'node:test'
import { makeAssignments, validateDraw } from '../server/utils/draw'

const names = ['Alicia', 'Ben', 'Cara', 'Daniel', 'Emma', 'Finn', 'Grace', 'Hugo']

test('1,000 draws always give every person one unique recipient and never themselves', () => {
  for (let i = 0; i < 1000; i++) {
    const assignments = makeAssignments(8)
    assert.equal(assignments.length, 8)
    assert.deepEqual([...assignments].sort(), [0, 1, 2, 3, 4, 5, 6, 7])
    assert.ok(assignments.every((recipient, giver) => recipient !== giver))
  }
})

test('groups smaller than three and impossible group sizes fail', () => {
  for (const size of [0, 1, 2, -1, 2.5, NaN]) assert.throws(() => makeAssignments(size))
})

test('validation requires at least three distinct, nonempty names', () => {
  for (const invalid of [undefined, null, {}, { names: names.slice(0, 2) }, { names: ['', ...names.slice(1)] }, { names: [42, ...names.slice(1)] }, { names: ['ben', ...names.slice(1)] }, { names: ['A'.repeat(41), ...names.slice(1)] }, { names, title: 42 }, { names, title: 'A'.repeat(81) }]) {
    assert.throws(() => validateDraw(invalid))
  }
})

test('validation normalises spaces and Unicode and detects equivalent names', () => {
  assert.deepEqual(validateDraw({ names: ['  Alicia  Smith ', ...names.slice(1)] }), { title: 'Our Secret Santa', names: ['Alicia Smith', ...names.slice(1)], emails: names.map(() => null) })
  assert.throws(() => validateDraw({ names: ['José', 'Jose\u0301', ...names.slice(2)] }))
  assert.throws(() => validateDraw({ names: ['Ali\u200bcia', ...names.slice(1)] }))
})


test('flexible groups and optional emails are validated and normalised', () => {
  for (const size of [3, 8, 12]) {
    const names = Array.from({ length: size }, (_, i) => `Person ${i}`)
    assert.equal(validateDraw({ names }).names.length, size)
    const assignments = makeAssignments(size)
    assert.equal(new Set(assignments).size, size)
    assert.ok(assignments.every((recipient, giver) => recipient !== giver))
  }
  assert.deepEqual(validateDraw({ names: names.slice(0, 3), emails: [' a@example.com ', '', '  '] }).emails, ['a@example.com', null, null])
  for (const emails of [[], ['bad', '', ''], [42, '', ''], 'bad']) {
    assert.throws(() => validateDraw({ names: names.slice(0, 3), emails }))
  }
})
