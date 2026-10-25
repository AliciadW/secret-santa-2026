import { createError } from 'h3'
import { getDrawStore } from '../../utils/store'
import { withDrawErrors } from '../../utils/api'

export default defineEventHandler(async (event) => {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of event.node.req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length
    if (size > 8192) throw createError({ statusCode: 413, statusMessage: 'This draw is too large. Please use eight short names.' })
    chunks.push(buffer)
  }
  let body: unknown
  try {
    body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Please send a valid draw.' })
  }
  return await withDrawErrors(() => getDrawStore().create(body))
})
