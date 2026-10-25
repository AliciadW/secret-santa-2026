import assert from 'node:assert/strict'
import test from 'node:test'
import { withDrawErrors } from '../server/utils/api'
import { DrawError } from '../server/utils/draw'

test('the API wrapper translates rejected asynchronous draw errors to HTTP errors', async () => {
  await assert.rejects(withDrawErrors(async () => {
    throw new DrawError(404, 'This invitation is invalid.')
  }), (error: any) => error.statusCode === 404 && error.statusMessage === 'This invitation is invalid.')
  await assert.rejects(withDrawErrors(() => {
    throw new DrawError(400, 'Invalid names.')
  }), (error: any) => error.statusCode === 400)
  assert.equal(await withDrawErrors(async () => 'ok'), 'ok')
  const cause = new Error('unexpected failure')
  await assert.rejects(withDrawErrors(async () => { throw cause }), error => error === cause)
})
