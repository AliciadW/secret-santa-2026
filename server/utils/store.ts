import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import { getDatabase } from '@netlify/database'
import { asc, eq, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/netlify-db'
import { alias, type PgAsyncDatabase, type PgQueryResultHKT } from 'drizzle-orm/pg-core'
import { draws, participants } from '../../db/schema'
import { DrawError, makeAssignments, validateDraw } from './draw'

const secret = () => randomBytes(32).toString('base64url')
const hash = (value: string) => createHash('sha256').update(value).digest('hex')
export type DrawDatabase = PgAsyncDatabase<PgQueryResultHKT>

export class DrawStore {
  constructor(private db: DrawDatabase) {}

  async create(input: unknown) {
    const { title, names } = validateDraw(input)
    const id = randomUUID()
    const adminKey = secret()
    const people = names.map(name => ({ id: randomUUID(), name, token: secret() }))
    const assignments = makeAssignments(people.length)
    await this.db.transaction(async (tx) => {
      await tx.insert(draws).values({ id, title, adminKeyHash: hash(adminKey) })
      // Insert the entire cycle at once so same-draw foreign keys are valid
      // when Postgres checks them at the end of the statement.
      await tx.insert(participants).values(people.map((person, position) => ({
        ...person,
        drawId: id,
        recipientId: people[assignments[position]!]!.id,
        position,
      })))
    })
    return { id, adminKey }
  }

  async organiser(id: string, key: string) {
    const [draw] = await this.db.select().from(draws).where(eq(draws.id, id)).limit(1)
    if (!draw || !timingSafeEqual(Buffer.from(draw.adminKeyHash), Buffer.from(hash(key)))) {
      throw new DrawError(404, 'This organiser link is invalid. Check that you copied the full link.')
    }
    const people = await this.db.select({
      name: participants.name,
      token: participants.token,
      openedAt: participants.openedAt,
    }).from(participants).where(eq(participants.drawId, id)).orderBy(asc(participants.position))
    return {
      id: draw.id,
      title: draw.title,
      participants: people.map(person => ({ name: person.name, token: person.token, opened: Boolean(person.openedAt) })),
    }
  }

  private async person(token: string) {
    const recipient = alias(participants, 'recipient')
    const [person] = await this.db.select({
      id: participants.id,
      name: participants.name,
      openedAt: participants.openedAt,
      title: draws.title,
      recipient: recipient.name,
    }).from(participants)
      .innerJoin(draws, eq(draws.id, participants.drawId))
      .innerJoin(recipient, eq(recipient.id, participants.recipientId))
      .where(eq(participants.token, token)).limit(1)
    if (!person) throw new DrawError(404, 'This invitation is invalid. Ask your organiser for your personal link.')
    return person
  }

  async invitation(token: string) {
    const person = await this.person(token)
    return { name: person.name, title: person.title, opened: Boolean(person.openedAt) }
  }

  async reveal(token: string) {
    const person = await this.person(token)
    await this.db.update(participants).set({
      openedAt: sql`COALESCE(${participants.openedAt}, CURRENT_TIMESTAMP)`,
    }).where(eq(participants.id, person.id))
    return { name: person.name, recipient: person.recipient }
  }
}

let store: DrawStore | undefined
export function getDrawStore() {
  if (store) return store
  const client = getDatabase()
  if (client.driver === 'serverless') {
    // Drizzle rc.5 calls the HTTP client with SQL strings. Neon v1 accepts that
    // form through .query(); direct calls now require tagged templates.
    // Proxy the callable without losing Netlify's refreshed credentials or
    // Neon's query/transaction helpers. WebSocket transactions are unchanged.
    client.httpClient = new Proxy(client.httpClient, {
      apply(target, thisArg, args) {
        return typeof args[0] === 'string'
          ? Reflect.apply(target.query, target, args)
          : Reflect.apply(target, thisArg, args)
      },
    })
  }
  return store = new DrawStore(drizzle({ client, paramsInErrors: false }))
}
