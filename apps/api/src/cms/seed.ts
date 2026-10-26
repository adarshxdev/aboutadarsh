import { count } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import type { RawContent } from '@portfolio/shared/content'
import { COLLECTION_KEYS, getCollection } from '@portfolio/shared/cms'
import * as schema from '../db/schema.js'

/**
 * Copies content (normally the defaults in @portfolio/shared) into an empty
 * database. Does nothing once the table has any rows, so it's safe to run on
 * every deploy. Takes the db as a parameter so the CLI can pass its own client.
 */
export async function seedContent(db: PostgresJsDatabase<typeof schema>, raw: RawContent) {
  const [{ total }] = await db.select({ total: count() }).from(schema.contentEntries)
  if (total > 0) return { inserted: 0, skipped: true as const }

  const rows = COLLECTION_KEYS.flatMap((collection) => {
    const value = raw[collection]
    const items = getCollection(collection).singleton ? [value] : (value as unknown[])
    return items.map((data, position) => ({ collection, data, position }))
  })

  if (rows.length) await db.insert(schema.contentEntries).values(rows)
  return { inserted: rows.length, skipped: false as const }
}
