import { randomInt } from 'node:crypto'

export class DrawError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message)
  }
}

export function validateDraw(input: unknown): { title: string; names: string[]; emails: (string | null)[] } {
  if (!input || typeof input !== 'object') throw new DrawError(400, 'Please enter at least three names.')
  const body = input as Record<string, unknown>
  if (!Array.isArray(body.names) || body.names.length < 3) {
    throw new DrawError(400, 'Your draw needs at least three people.')
  }
  const names = body.names.map((name) => {
    if (typeof name !== 'string') throw new DrawError(400, 'Every person needs a name.')
    const clean = name.normalize('NFC').trim().replace(/\s+/g, ' ')
    if (!clean || clean.length > 40 || /[\p{Cc}\p{Cf}]/u.test(clean)) {
      throw new DrawError(400, 'Use names between 1 and 40 characters, without control characters.')
    }
    return clean
  })
  if (new Set(names.map(name => name.toLocaleLowerCase('en-GB'))).size !== names.length) {
    throw new DrawError(400, 'Each name must be different. Add a surname or initial if needed.')
  }
  if (body.title !== undefined && typeof body.title !== 'string') throw new DrawError(400, 'Please use a valid draw name.')
  const title = (body.title as string | undefined)?.trim() || 'Our Secret Santa'
  if (title.length > 80 || /[\p{Cc}\p{Cf}]/u.test(title)) throw new DrawError(400, 'Keep the draw name under 80 characters, without control characters.')
  if (body.emails !== undefined && (!Array.isArray(body.emails) || body.emails.length !== names.length)) {
    throw new DrawError(400, 'Provide one optional email address per person.')
  }
  const emails = names.map((_, index) => {
    const value = (body.emails as unknown[] | undefined)?.[index]
    if (value === undefined || value === null || value === '') return null
    if (typeof value !== 'string') throw new DrawError(400, 'Please use valid email addresses.')
    const email = value.trim()
    if (!email) return null
    if (email.length > 254 || /[\p{Cc}\p{Cf}]/u.test(email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new DrawError(400, `Please use a valid email address for ${names[index]}.`)
    }
    return email
  })
  return { title, names, emails }
}

// Rejection sampling over Fisher–Yates permutations gives every valid draw the
// same chance, including draws with multiple cycles. Never pick greedily.
export function makeAssignments(size: number): number[] {
  if (!Number.isInteger(size) || size < 3) throw new DrawError(400, 'At least three people are needed.')
  while (true) {
    const recipients = Array.from({ length: size }, (_, i) => i)
    for (let i = size - 1; i > 0; i--) {
      const j = randomInt(i + 1)
      ;[recipients[i], recipients[j]] = [recipients[j]!, recipients[i]!]
    }
    if (recipients.every((recipient, giver) => recipient !== giver)) return recipients
  }
}
