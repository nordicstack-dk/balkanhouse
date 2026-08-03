import 'dotenv/config'

import { getPayloadClient } from '../src/lib/payload'

/**
 * Initializes Payload with `push` enabled so the Postgres schema is synced to
 * the current collection config (additive columns/indexes). Run locally against
 * the target DATABASE_URL; do NOT set PAYLOAD_DISABLE_DB_PUSH.
 */
async function main() {
  console.log('[db-push] initializing Payload (schema push)...')
  await getPayloadClient()
  console.log('[db-push] done — schema synced.')
  process.exit(0)
}

main().catch((err) => {
  console.error('[db-push] failed:', err)
  process.exit(1)
})
