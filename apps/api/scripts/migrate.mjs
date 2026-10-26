/**
 * Applies drizzle/ migrations. Plain Node (no tsx), so it runs in the Docker
 * image and in Vercel's build. Skips quietly without DATABASE_URL, so builds
 * without a database still pass.
 */
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { fileURLToPath } from 'node:url'
import postgres from 'postgres'

const url = process.env.DATABASE_URL
if (!url) {
  console.log('[migrate] DATABASE_URL not set — skipping.')
  process.exit(0)
}

const client = postgres(url, { max: 1, prepare: false, onnotice: () => {} })
try {
  await migrate(drizzle(client), { migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)) })
  console.log('[migrate] up to date.')
} catch (error) {
  console.error('[migrate] failed:', error)
  process.exitCode = 1
} finally {
  await client.end()
}
