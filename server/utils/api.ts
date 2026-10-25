import { createError, getHeader, type H3Event } from 'h3'
import { DrawError } from './draw'

export function bearerToken(event: H3Event) {
  const header = getHeader(event, 'authorization') || ''
  if (!/^Bearer [A-Za-z0-9_-]{43}$/.test(header)) {
    throw createError({ statusCode: 401, statusMessage: 'Your private link is missing or incomplete.' })
  }
  return header.slice(7)
}

export function withDrawErrors<T>(operation: () => T): T {
  try { return operation() } catch (error) {
    if (error instanceof DrawError) {
      throw createError({ statusCode: error.statusCode, statusMessage: error.message })
    }
    throw error
  }
}
