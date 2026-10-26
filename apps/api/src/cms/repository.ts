import { asc } from 'drizzle-orm'
import { staticContent, type RawContent } from '@portfolio/shared/content'
import { rowsToRaw } from '@portfolio/shared/cms'
import { db, schema } from '../db/index.js'
import { logger } from '../lib/logger.js'

/**
 * Site content: the database when configured and seeded, otherwise the
 * defaults in @portfolio/shared. Memoised briefly per instance; every admin
 * write calls `invalidateContent()`.
 */
const TTL_MS = 30_000
let memo: { at: number; value: RawContent } | null = null

export const invalidateContent = () => {
  memo = null
}

export async function loadContent(): Promise<RawContent> {
  if (memo && Date.now() - memo.at < TTL_MS) return memo.value
  let value = staticContent
  if (db) {
    try {
      const rows = await db
        .select({ collection: schema.contentEntries.collection, data: schema.contentEntries.data })
        .from(schema.contentEntries)
        .orderBy(asc(schema.contentEntries.position), asc(schema.contentEntries.createdAt))
      // Empty table = never seeded; once seeded, the database is the source of truth.
      if (rows.length) {
        value = rowsToRaw(rows, (collection, message) =>
          logger.warn({ collection, message }, 'content: skipping invalid row'),
        )
      }
    } catch (err) {
      // Serve defaults rather than failing the whole site, but don't cache them.
      logger.error({ err }, 'content: database unavailable, serving defaults')
      return staticContent
    }
  }
  memo = { at: Date.now(), value }
  return value
}
