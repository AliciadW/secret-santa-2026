import { randomInt } from 'node:crypto'

export class DrawError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message)
  }
}

export function validateDraw(input: unknown): { title: string; names: string[] } {
  if (!input || typeof input !== 'object') throw new DrawError(400, 'Please enter eight names.')
  const body = input as Record<string, unknown>
  if (!Array.isArray(body.names) || body.names.length !== 8) {
    throw new DrawError(400, 'Your draw needs exactly eight people.')
  }
  const names = body.names.map((name) => {
    if (typeof name !== 'string') throw new DrawError(400, 'Every person needs a name.')
    const clean = name.normalize('NFC').trim().replace(/\s+/g, ' ')
    if (!clean || clean.length > 40 || /[\p{Cc}\p{Cf}]/u.test(clean)) {
      throw new DrawError(400, 'Use names between 1 and 40 characters, without control characters.')
    }
    return clean
  })
  if (new Set(names.map(name => name.toLocaleLowerCase('en-GB'))).size !== 8) {
    throw new DrawError(400, 'Each name must be different. Add a surname or initial if needed.')
  }
  if (body.title !== undefined && typeof body.title !== 'string') throw new DrawError(400, 'Please use a valid draw name.')
  const title = (body.title as string | undefined)?.trim() || 'Our Secret Santa'
  if (title.length > 80 || /[\p{Cc}\p{Cf}]/u.test(title)) throw new DrawError(400, 'Keep the draw name under 80 characters, without control characters.')
  return { title, names }
}

// Rejection sampling over Fisher–Yates permutations gives every valid draw the
// same chance, including draws with multiple cycles. Never pick greedily.
export function makeAssignments(size: number): number[] {
  if (!Number.isInteger(size) || size < 2) throw new DrawError(400, 'At least two people are needed.')
  while (true) {
    const recipients = Array.from({ length: size }, (_, i) => i)
    for (let i = size - 1; i > 0; i--) {
      const j = randomInt(i + 1)
      ;[recipients[i], recipients[j]] = [recipients[j]!, recipients[i]!]
    }
    if (recipients.every((recipient, giver) => recipient !== giver)) return recipients
  }
}
