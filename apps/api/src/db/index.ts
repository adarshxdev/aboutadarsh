import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '../env.js'
import * as schema from './schema.js'

/**
 * The database is optional. Without DATABASE_URL the API still runs: content is
 * served from the defaults in @portfolio/shared, and contact submissions are
 * emailed and logged instead of stored.
 *
 * postgres.js speaks plain Postgres, so the same code runs against the local
 * Docker database, Supabase or Neon. `prepare: false` keeps it compatible with
 * transaction-mode poolers (Supabase on port 6543), which serverless needs.
 */
const url = env.DATABASE_URL

type Db = PostgresJsDatabase<typeof schema>

// Reuse one client across dev hot reloads, or every edit opens a new pool.
const globalForDb = globalThis as unknown as { __db?: Db }

function connect(connectionString: string): Db {
  const client = postgres(connectionString, {
    prepare: false,
    // One connection per serverless instance; a small pool elsewhere.
    max: process.env.VERCEL ? 1 : 10, // VERCEL is set by the platform, not by us.
    idle_timeout: 20,
    connect_timeout: 10,
  })
  return drizzle(client, { schema })
}

export const db: Db | null = url ? (globalForDb.__db ??= connect(url)) : null

export const hasDatabase = Boolean(url)
export { schema }
