/**
 * Copies the default content (@portfolio/shared) into an empty database. No-op once
 * the database has content, so it's safe on every deploy. Run: npm run db:seed
 * To overwrite existing content with the defaults: npm run db:seed -- --replace
 */
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { staticContent } from '@portfolio/shared/content'
import * as schema from '../src/db/schema.js'
import { seedContent } from '../src/cms/seed.js'

const url = process.env.DATABASE_URL
if (!url) {
  console.log('[seed] DATABASE_URL not set — skipping.')
  process.exit(0)
}

// --replace: wipe content and re-import the defaults (loses any edits made in /admin).
const replace = process.argv.includes('--replace')

const client = postgres(url, { max: 1, prepare: false })
try {
  const db = drizzle(client, { schema })
  if (replace) {
    console.warn('[seed] --replace: deleting all content entries (media files are kept).')
    await db.delete(schema.contentEntries)
  }
  const result = await seedContent(db, staticContent)
  console.log(
    result.skipped
      ? '[seed] database already has content — skipped.'
      : `[seed] inserted ${result.inserted} entries.`,
  )
} catch (error) {
  console.error('[seed] failed:', error)
  process.exitCode = 1
} finally {
  await client.end()
}
