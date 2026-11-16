import { createError, readRawBody } from 'h3'
import { getDrawStore } from '../../utils/store'
import { sendInvitationEmail } from '../../utils/email'
import { withDrawErrors } from '../../utils/api'

export default defineEventHandler(async (event) => {
  // H3 supports both Node streams and the Web Request body supplied by Netlify.
  const rawBody = await readRawBody(event, false)
  if (rawBody && rawBody.byteLength > 8192) {
    throw createError({ statusCode: 413, statusMessage: 'This draw is too large. Please use a smaller group or shorter entries.' })
  }
  let body: unknown
  try {
    body = JSON.parse(rawBody?.toString('utf8') || '')
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Please send a valid draw.' })
  }
  return await withDrawErrors(async () => {
    const store = getDrawStore()
    const draw = await store.create(body)
    try { await store.sendPending(draw.id, draw.adminKey, sendInvitationEmail) }
    catch { /* The saved draw remains accessible; pending sends can be retried. */ }
    return draw
  })
})
