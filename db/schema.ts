import { sql } from 'drizzle-orm'
import { check, foreignKey, integer, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core'

export const draws = pgTable('draws', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  adminKeyHash: text('admin_key_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
})

export const participants = pgTable('participants', {
  id: text('id').primaryKey(),
  drawId: text('draw_id').notNull().references(() => draws.id),
  name: text('name').notNull(),
  token: text('token').notNull().unique(),
  recipientId: text('recipient_id').notNull(),
  openedAt: timestamp('opened_at', { withTimezone: true, mode: 'string' }),
  // Postgres has no rowid: preserve the organiser's original name order explicitly.
  position: integer('position').notNull(),
}, table => [
  unique('participants_draw_id_id_unique').on(table.drawId, table.id),
  unique('participants_draw_id_name_unique').on(table.drawId, table.name),
  unique('participants_draw_id_recipient_id_unique').on(table.drawId, table.recipientId),
  unique('participants_draw_id_position_unique').on(table.drawId, table.position),
  check('participants_no_self_assignment', sql`${table.id} <> ${table.recipientId}`),
  check('participants_position_range', sql`${table.position} >= 0 AND ${table.position} < 8`),
  foreignKey({
    name: 'participants_recipient_same_draw_fk',
    columns: [table.drawId, table.recipientId],
    foreignColumns: [table.drawId, table.id],
  }),
])
