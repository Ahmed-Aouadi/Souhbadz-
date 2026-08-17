import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL

const globalForDb = globalThis as unknown as { __pool?: Pool; __poolUrl?: string }

// The cached pool is keyed by connection string so a pool created before the
// database credentials existed is never reused after they arrive.
if (globalForDb.__pool && globalForDb.__poolUrl !== connectionString) {
  void globalForDb.__pool.end().catch(() => {})
  globalForDb.__pool = undefined
}

export const pool = globalForDb.__pool ?? new Pool({ connectionString })

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__pool = pool
  globalForDb.__poolUrl = connectionString
}

export const db = drizzle(pool, { schema })

/** True once a Postgres connection string is present in the environment. */
export const isDbConfigured = Boolean(connectionString)

/**
 * Runs a read query, falling back to a safe default when the database is not
 * configured yet or the tables have not been created. Keeps the storefront and
 * admin panel renderable before a database is connected.
 */
export async function safeRead<T>(run: () => Promise<T>, fallback: T, label: string): Promise<T> {
  if (!isDbConfigured) return fallback
  try {
    return await run()
  } catch (error) {
    console.error(`[db] ${label} failed:`, error instanceof Error ? error.message : error)
    return fallback
  }
}
