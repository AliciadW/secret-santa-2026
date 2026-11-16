export interface EmailInvitation { id: string; name: string; email: string; token: string; title: string }
export type InvitationSender = (invitation: EmailInvitation) => Promise<void>
const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)

export const sendInvitationEmail: InvitationSender = async (person) => {
  const { RESEND_API_KEY, EMAIL_FROM, SITE_URL } = process.env
  if (!RESEND_API_KEY || !EMAIL_FROM || !SITE_URL) throw new Error('Email delivery is not configured')
  const origin = new URL(SITE_URL)
  if (!['http:', 'https:'].includes(origin.protocol)) throw new Error('Invalid site URL')
  const link = new URL('/pick', origin)
  link.search = new URLSearchParams({ name: person.name, token: person.token }).toString()
  const text = `Hi ${person.name},\n\nYou’re invited to ${person.title}! Open your private invitation to reveal who you’re buying for:\n\n${link}\n\nKeep this link private. Merry Christmas!`
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    signal: AbortSignal.timeout(8000),
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `invitation/${person.id}` },
    body: JSON.stringify({ from: EMAIL_FROM, to: [person.email], subject: `Your Secret Santa invitation: ${person.title}`,
      text, html: `<p>Hi ${escape(person.name)},</p><p>You’re invited to ${escape(person.title)}!</p><p><a href="${escape(link.toString())}">Open your private invitation</a> to reveal who you’re buying for.</p><p>Keep this link private. Merry Christmas!</p>` }),
  })
  if (!response.ok) throw new Error('Email could not be sent')
}
