/**
 * Sync Payload collection config to Postgres (development only).
 * Triggers pushDevSchema on connect when NODE_ENV is not production.
 *
 * Usage: cross-env NODE_ENV=development tsx scripts/sync-dev-schema.ts
 *        (PowerShell: $env:NODE_ENV="development"; npx tsx scripts/sync-dev-schema.ts)
 */
import 'dotenv/config'

import { sql } from '@payloadcms/db-postgres'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

const REQUIRED_COLUMNS: Record<string, readonly string[]> = {
  orders: [
    'customer_address_street',
    'customer_address_city',
    'customer_address_postal_code',
    'customer_address_country',
    'pickup_notes',
    'has_admin_adjustments',
  ],
  orders_line_items: ['original_quantity', 'original_unit_price_dkk', 'admin_adjusted'],
  products_locales: ['admin_label'],
}

async function listColumns(tableName: string, payload: Awaited<ReturnType<typeof getPayload>>) {
  const result = await payload.db.drizzle.execute(
    sql`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = ${tableName} ORDER BY ordinal_position`,
  )

  const resultUnknown = result as unknown
  const rows =
    (resultUnknown as { rows?: { column_name: string }[] }).rows ??
    (Array.isArray(resultUnknown) ? (resultUnknown as { column_name: string }[]) : [])

  return new Set(rows.map((r) => r.column_name))
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error(
      'Refusing to auto-push schema when NODE_ENV=production. Run: pnpm payload migrate:create && pnpm payload migrate',
    )
    process.exit(1)
  }

  console.log('Connecting to Postgres and pushing dev schema (if needed)...')
  const payload = await getPayload({ config: configPromise })

  const allMissing: string[] = []

  for (const [table, required] of Object.entries(REQUIRED_COLUMNS)) {
    const columns = await listColumns(table, payload)
    console.log(`${table} columns:`, [...columns].sort().join(', '))

    const missing = required.filter((c) => !columns.has(c))
    if (missing.length) {
      allMissing.push(...missing.map((c) => `${table}.${c}`))
    }
  }

  if (allMissing.length) {
    console.error('Still missing after schema push:', allMissing.join(', '))
    process.exit(1)
  }

  console.log('OK: all required schema columns are present.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
