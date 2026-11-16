import assert from 'node:assert/strict'
import test from 'node:test'
import { sendInvitationEmail } from '../server/utils/email'

const person = { id: 'person-id', name: '<Alice>', email: 'alice@example.com', token: 'private-token', title: 'Christmas & friends' }

test('email sender uses private configuration, safe content and stable idempotency', async (t) => {
  const saved = { ...process.env }
  t.after(() => { process.env = saved; t.mock.restoreAll() })
  process.env.RESEND_API_KEY = 'test-key'
  process.env.EMAIL_FROM = 'Santa <santa@example.com>'
  process.env.SITE_URL = 'https://santa.example.com'
  const requests: RequestInit[] = []
  t.mock.method(globalThis, 'fetch', async (url: string, init: RequestInit) => {
    assert.equal(url, 'https://api.resend.com/emails')
    requests.push(init)
    return new Response('{}', { status: 200 })
  })
  await sendInvitationEmail(person)
  await sendInvitationEmail(person)
  const body = JSON.parse(requests[0]!.body as string)
  assert.deepEqual(body.to, [person.email])
  assert.match(body.html, /&lt;Alice&gt;/)
  assert.match(body.html, /Christmas &amp; friends/)
  assert.match(body.text, /https:\/\/santa.example.com\/pick\?name=%3CAlice%3E&token=private-token/)
  assert.deepEqual(requests[0]!.headers, requests[1]!.headers)
  assert.ok(requests[0]!.signal)
  t.mock.method(globalThis, 'fetch', async () => new Response('{}', { status: 429 }))
  await assert.rejects(sendInvitationEmail(person))
  t.mock.method(globalThis, 'fetch', async () => { throw new DOMException('Timed out', 'TimeoutError') })
  await assert.rejects(sendInvitationEmail(person))
  delete process.env.RESEND_API_KEY
  await assert.rejects(sendInvitationEmail(person))
})
