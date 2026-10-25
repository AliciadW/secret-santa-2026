import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { DrawError, makeAssignments, validateDraw } from './draw'

type DrawRow = { id: string; title: string; admin_key_hash: string }
type PersonRow = { id: string; name: string; token: string; recipient_id: string; opened_at: string | null }
const secret = () => randomBytes(32).toString('base64url')
const hash = (value: string) => createHash('sha256').update(value).digest('hex')

export class DrawStore {
  private db: DatabaseSync

  constructor(path: string) {
    if (path !== ':memory:') mkdirSync(dirname(resolve(path)), { recursive: true })
    this.db = new DatabaseSync(path)
    this.db.exec(`
      PRAGMA foreign_keys = ON;
      PRAGMA busy_timeout = 5000;
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS draws (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        admin_key_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS participants (
        id TEXT PRIMARY KEY,
        draw_id TEXT NOT NULL REFERENCES draws(id),
        name TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        recipient_id TEXT NOT NULL,
        opened_at TEXT,
        UNIQUE (draw_id, id),
        UNIQUE (draw_id, name),
        UNIQUE (draw_id, recipient_id),
        CHECK (id != recipient_id),
        FOREIGN KEY (draw_id, recipient_id) REFERENCES participants(draw_id, id)
          DEFERRABLE INITIALLY DEFERRED
      );
    `)
  }

  create(input: unknown) {
    const { title, names } = validateDraw(input)
    const id = randomUUID()
    const adminKey = secret()
    const people = names.map(name => ({ id: randomUUID(), name, token: secret() }))
    const assignments = makeAssignments(people.length)
    this.db.exec('BEGIN IMMEDIATE')
    try {
      this.db.prepare('INSERT INTO draws (id, title, admin_key_hash) VALUES (?, ?, ?)').run(id, title, hash(adminKey))
      const insert = this.db.prepare('INSERT INTO participants (id, draw_id, name, token, recipient_id) VALUES (?, ?, ?, ?, ?)')
      people.forEach((person, i) => insert.run(person.id, id, person.name, person.token, people[assignments[i]!]!.id))
      this.db.exec('COMMIT')
    } catch (error) {
      this.db.exec('ROLLBACK')
      throw error
    }
    return { id, adminKey }
  }

  organiser(id: string, key: string) {
    const draw = this.db.prepare('SELECT id, title, admin_key_hash FROM draws WHERE id = ?').get(id) as DrawRow | undefined
    if (!draw || !timingSafeEqual(Buffer.from(draw.admin_key_hash), Buffer.from(hash(key)))) {
      throw new DrawError(404, 'This organiser link is invalid. Check that you copied the full link.')
    }
    const people = this.db.prepare('SELECT id, name, token, opened_at FROM participants WHERE draw_id = ? ORDER BY rowid').all(id) as PersonRow[]
    return {
      id: draw.id,
      title: draw.title,
      participants: people.map(person => ({ name: person.name, token: person.token, opened: Boolean(person.opened_at) })),
    }
  }

  private person(token: string) {
    const row = this.db.prepare(`
      SELECT p.id, p.name, p.opened_at, d.title, r.name AS recipient
      FROM participants p
      JOIN draws d ON d.id = p.draw_id
      JOIN participants r ON r.id = p.recipient_id
      WHERE p.token = ?
    `).get(token) as { id: string; name: string; opened_at: string | null; title: string; recipient: string } | undefined
    if (!row) throw new DrawError(404, 'This invitation is invalid. Ask your organiser for your personal link.')
    return row
  }

  invitation(token: string) {
    const person = this.person(token)
    return { name: person.name, title: person.title, opened: Boolean(person.opened_at) }
  }

  reveal(token: string) {
    const person = this.person(token)
    this.db.prepare('UPDATE participants SET opened_at = COALESCE(opened_at, CURRENT_TIMESTAMP) WHERE id = ?').run(person.id)
    return { name: person.name, recipient: person.recipient }
  }

  close() { this.db.close() }
}

let store: DrawStore | undefined
export function getDrawStore() {
  return store ??= new DrawStore(process.env.SECRET_SANTA_DB_PATH || resolve('.data/secret-santa.sqlite'))
}
