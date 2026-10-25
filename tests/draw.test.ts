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

test('two people can draw one another and impossible group sizes fail', () => {
  assert.deepEqual(makeAssignments(2), [1, 0])
  for (const size of [0, 1, -1, 2.5, NaN]) assert.throws(() => makeAssignments(size))
})

test('validation requires exactly eight distinct, nonempty names', () => {
  for (const invalid of [undefined, null, {}, { names: names.slice(1) }, { names: [...names, 'Ivy'] }, { names: ['', ...names.slice(1)] }, { names: [42, ...names.slice(1)] }, { names: ['ben', ...names.slice(1)] }, { names: ['A'.repeat(41), ...names.slice(1)] }, { names, title: 42 }, { names, title: 'A'.repeat(81) }]) {
    assert.throws(() => validateDraw(invalid))
  }
})

test('validation normalises spaces and Unicode and detects equivalent names', () => {
  assert.deepEqual(validateDraw({ names: ['  Alicia  Smith ', ...names.slice(1)] }), { title: 'Our Secret Santa', names: ['Alicia Smith', ...names.slice(1)] })
  assert.throws(() => validateDraw({ names: ['José', 'Jose\u0301', ...names.slice(2)] }))
  assert.throws(() => validateDraw({ names: ['Ali\u200bcia', ...names.slice(1)] }))
})
