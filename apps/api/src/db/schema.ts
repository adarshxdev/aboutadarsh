import { bigint, boolean, index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

/**
 * Site content edited from /admin. One row per entry; `data` is the entry as
 * validated by its collection's Zod schema (src/lib/cms/collections.ts), so
 * adding a field never needs a migration. Singletons (profile, home) have one row.
 */
export const contentEntries = pgTable(
  'content_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    collection: text('collection').notNull(),
    data: jsonb('data').notNull(),
    /** Manual order within a collection; lower first. */
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('content_entries_collection_idx').on(table.collection, table.position)],
)

/** Uploaded files. The bytes live in S3-compatible storage under `key`. */
export const media = pgTable(
  'media',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    key: text('key').notNull().unique(),
    filename: text('filename').notNull(),
    contentType: text('content_type').notNull(),
    size: bigint('size', { mode: 'number' }).notNull(),
    kind: text('kind').notNull(),
    alt: text('alt'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('media_created_at_idx').on(table.createdAt)],
)

export const contacts = pgTable(
  'contacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    company: text('company'),
    intent: text('intent').notNull(),
    message: text('message').notNull(),
    budget: text('budget'),
    timeline: text('timeline'),
    source: text('source'),
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    utmCampaign: text('utm_campaign'),
    referrer: text('referrer'),
    /** sha256(ip + IP_HASH_SALT). The raw IP is never stored — plan.md §10. */
    ipHash: text('ip_hash'),
    userAgent: text('user_agent'),
    status: text('status').notNull().default('new'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('contacts_created_at_idx').on(table.createdAt)],
)

export const subscribers = pgTable('subscribers', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  confirmed: boolean('confirmed').notNull().default(false),
  confirmToken: text('confirm_token'),
  unsubscribeToken: text('unsubscribe_token').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
})

export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Anonymous, rotating, never linked to an identity. */
    sessionId: text('session_id'),
    type: text('type').notNull(),
    path: text('path'),
    meta: jsonb('meta'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('events_type_created_idx').on(table.type, table.createdAt)],
)

/** Retention: purge rows older than 12 months — plan.md §10. */
export const EVENT_RETENTION_DAYS = 365
export type NewContact = typeof contacts.$inferInsert
export type NewEvent = typeof events.$inferInsert
export type ContentEntry = typeof contentEntries.$inferSelect
export type Media = typeof media.$inferSelect
