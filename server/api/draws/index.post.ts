import { createError, readRawBody } from 'h3'
import { getDrawStore } from '../../utils/store'
import { withDrawErrors } from '../../utils/api'

export default defineEventHandler(async (event) => {
  // H3 supports both Node streams and the Web Request body supplied by Netlify.
  const rawBody = await readRawBody(event, false)
  if (rawBody && rawBody.byteLength > 8192) {
    throw createError({ statusCode: 413, statusMessage: 'This draw is too large. Please use shorter names.' })
  }
  let body: unknown
  try {
    body = JSON.parse(rawBody?.toString('utf8') || '')
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Please send a valid draw.' })
  }
  return await withDrawErrors(() => getDrawStore().create(body))
})
