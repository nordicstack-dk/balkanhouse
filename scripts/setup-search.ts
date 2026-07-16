/**
 * One-time setup for diacritic-insensitive, typo-tolerant product search.
 *
 * Enables the `unaccent` and `pg_trgm` Postgres extensions, defines an
 * IMMUTABLE unaccent wrapper (the built-in unaccent() is only STABLE and
 * therefore not indexable), and builds a GIN trigram index on the
 * normalized product title.
 *
 * Idempotent and non-destructive — safe to run repeatedly. Run once against
 * each environment's database:
 *
 *   pnpm setup:search
 *
 * The storefront falls back to in-process search until this has run, so
 * deploying the code before running this is safe.
 */
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

async function getPayloadInstance() {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config.js')
  return getPayload({ config: await config })
}

const STATEMENTS: { label: string; sql: string }[] = [
  {
    label: 'unaccent extension',
    sql: `CREATE EXTENSION IF NOT EXISTS unaccent`,
  },
  {
    label: 'pg_trgm extension',
    sql: `CREATE EXTENSION IF NOT EXISTS pg_trgm`,
  },
  {
    label: 'bh_unaccent() immutable wrapper',
    // Two-arg unaccent with an explicit dictionary is IMMUTABLE (the
    // single-arg form is only STABLE and cannot be indexed).
    sql: `CREATE OR REPLACE FUNCTION bh_unaccent(text)
            RETURNS text
            LANGUAGE sql
            IMMUTABLE PARALLEL SAFE
          AS $$ SELECT public.unaccent('public.unaccent'::regdictionary, lower($1)) $$`,
  },
  {
    label: 'GIN trigram index on normalized title',
    // Non-CONCURRENTLY: products_locales is small and writes are rare
    // (admin-only). For a very large table, switch to CREATE INDEX
    // CONCURRENTLY (which must run outside a transaction).
    sql: `CREATE INDEX IF NOT EXISTS products_locales_title_trgm
            ON products_locales
            USING gin (bh_unaccent(title) gin_trgm_ops)`,
  },
]

async function main() {
  const payload = await getPayloadInstance()
  const pool = (payload.db as unknown as { pool?: { query: (t: string) => Promise<unknown> } }).pool
  if (!pool?.query) {
    throw new Error('Postgres pool not available on payload.db')
  }

  for (const { label, sql } of STATEMENTS) {
    process.stdout.write(`- ${label} ... `)
    await pool.query(sql)
    console.log('ok')
  }

  // Smoke-test the pieces so a bad environment fails loudly here, not at runtime.
  const check = (await pool.query(
    `SELECT bh_unaccent('Țuică') AS a, word_similarity('cozonak', bh_unaccent('Cozonac cu nucă')) AS sim`,
  )) as { rows: { a: string; sim: number }[] }
  const { a, sim } = check.rows[0]
  console.log(`\nVerification: bh_unaccent('Țuică') = '${a}' (expected 'tuica')`)
  console.log(`Verification: word_similarity('cozonak', 'cozonac cu nuca') = ${sim} (typo match)`)

  console.log('\nSearch setup complete.')
  process.exit(0)
}

main().catch((err) => {
  console.error('\nSearch setup failed:', err instanceof Error ? err.message : err)
  process.exit(1)
})
