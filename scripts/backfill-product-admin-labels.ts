import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

import { formatProductAdminLabel, resolveLocalizedString } from '../src/lib/products/admin-label.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

type Locale = 'ro' | 'da' | 'en'
const LOCALES: Locale[] = ['ro', 'da', 'en']

async function getPayloadInstance() {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config.js')
  return getPayload({ config: await config })
}

async function backfillProductAdminLabels(dryRun: boolean) {
  const payload = await getPayloadInstance()

  const products = await payload.find({
    collection: 'products',
    limit: 1000,
    pagination: false,
    depth: 0,
  })

  let updated = 0
  let skipped = 0

  for (const doc of products.docs) {
    if (typeof doc.id !== 'number' || typeof doc.sku !== 'string') {
      skipped += 1
      continue
    }

    for (const locale of LOCALES) {
      const localized = await payload.findByID({
        collection: 'products',
        id: doc.id,
        locale,
        fallbackLocale: false,
        depth: 0,
        context: { skipAdminLabelReadFix: true },
      })

      const localizedTitle = resolveLocalizedString(localized.title, locale)
      const nextLabel = formatProductAdminLabel(doc.sku, localizedTitle)
      const currentLabel = typeof localized.adminLabel === 'string' ? localized.adminLabel : ''

      if (nextLabel === currentLabel) {
        continue
      }

      if (dryRun) {
        console.log(`Would update ${doc.sku} (${locale}): ${nextLabel}`)
      } else {
        await payload.update({
          collection: 'products',
          id: doc.id,
          locale,
          data: { adminLabel: nextLabel },
        })
        console.log(`Updated ${doc.sku} (${locale}): ${nextLabel}`)
      }

      updated += 1
    }
  }

  console.log('')
  console.log('=== Summary ===')
  console.log(`Total products: ${products.docs.length}`)
  console.log(`Admin labels ${dryRun ? 'to update' : 'updated'}: ${updated}`)
  console.log(`Skipped: ${skipped}`)
}

const dryRun = process.argv.includes('--dry-run')

backfillProductAdminLabels(dryRun)
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('Backfill failed:', error)
    process.exit(1)
  })
