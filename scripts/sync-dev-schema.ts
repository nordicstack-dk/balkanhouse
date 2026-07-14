/**
 * Sync Payload collection config to Postgres (development only).
 * Triggers pushDevSchema on connect when NODE_ENV is not production.
 *
 * Usage: cross-env NODE_ENV=development tsx scripts/sync-dev-schema.ts
 */
import 'dotenv/config'

import { sql } from '@payloadcms/db-postgres'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

const ORDERS_PHASE3_COLUMNS = [
  'customer_address_street',
  'customer_address_city',
  'customer_address_postal_code',
  'customer_address_country',
  'pickup_notes',
] as const

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error(
      'Refusing to auto-push schema when NODE_ENV=production. Run: pnpm payload migrate:create && pnpm payload migrate',
    )
    process.exit(1)
  }

  console.log('Connecting to Postgres and pushing dev schema (if needed)...')
  const payload = await getPayload({ config: configPromise })

  const result = await payload.db.drizzle.execute(
    sql`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' ORDER BY ordinal_position`,
  )

  const resultUnknown = result as unknown
  const rows =
    (resultUnknown as { rows?: { column_name: string }[] }).rows ??
    (Array.isArray(resultUnknown) ? (resultUnknown as { column_name: string }[]) : [])
  const columns = new Set(rows.map((r) => r.column_name))

  console.log('orders columns:', [...columns].sort().join(', '))

  const missing = ORDERS_PHASE3_COLUMNS.filter((c) => !columns.has(c))
  if (missing.length) {
    console.error('Still missing after schema push:', missing.join(', '))
    process.exit(1)
  }

  console.log('OK: Phase 3 orders columns are present.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
