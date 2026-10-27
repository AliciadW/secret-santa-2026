import assert from 'node:assert/strict'
import test from 'node:test'
import { makeAssignments, validateDraw } from '../server/utils/draw'
import { MIN_PARTICIPANTS, MAX_PARTICIPANTS } from '../shared/utils/participants'

const names = ['Alicia', 'Ben', 'Cara', 'Daniel', 'Emma', 'Finn', 'Grace', 'Hugo']

test('1,000 draws across different group sizes give everyone one unique recipient and never themselves', () => {
  const sizes = [MIN_PARTICIPANTS, 3, 7, 8, 12, MAX_PARTICIPANTS]
  for (let i = 0; i < 1000; i++) {
    const size = sizes[i % sizes.length]!
    const assignments = makeAssignments(size)
    assert.equal(assignments.length, size)
    assert.deepEqual([...assignments].sort((a, b) => a - b), Array.from({ length: size }, (_, index) => index))
    assert.ok(assignments.every((recipient, giver) => recipient !== giver))
  }
})

test('two people can draw one another and impossible group sizes fail', () => {
  assert.deepEqual(makeAssignments(2), [1, 0])
  for (const size of [0, 1, -1, 2.5, NaN]) assert.throws(() => makeAssignments(size))
})

test('validation accepts configurable groups and rejects invalid counts or names', () => {
  for (const size of [MIN_PARTICIPANTS, 3, 7, 8, 9, 25, MAX_PARTICIPANTS]) {
    const group = Array.from({ length: size }, (_, index) => `Person ${index + 1}`)
    assert.deepEqual(validateDraw({ names: group }).names, group)
  }
  for (const invalid of [undefined, null, {}, { names: [] }, { names: ['Alicia'] }, { names: 'Alicia' }, { names: Array.from({ length: MAX_PARTICIPANTS + 1 }, (_, index) => `Person ${index}`) }, { names: ['', ...names.slice(1)] }, { names: [42, ...names.slice(1)] }, { names: ['ben', ...names.slice(1)] }, { names: ['A'.repeat(41), ...names.slice(1)] }, { names, title: 42 }, { names, title: 'A'.repeat(81) }]) {
    assert.throws(() => validateDraw(invalid))
  }
})

test('validation normalises spaces and Unicode and detects equivalent names', () => {
  assert.deepEqual(validateDraw({ names: ['  Alicia  Smith ', ...names.slice(1)] }), { title: 'Our Secret Santa', names: ['Alicia Smith', ...names.slice(1)] })
  assert.throws(() => validateDraw({ names: ['José', 'Jose\u0301', ...names.slice(2)] }))
  assert.throws(() => validateDraw({ names: ['Ali\u200bcia', ...names.slice(1)] }))
})
