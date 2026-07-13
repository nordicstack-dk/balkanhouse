import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

type Locale = 'ro' | 'da' | 'en'
const LOCALES: Locale[] = ['ro', 'da', 'en']

type LocalizedTitle = Partial<Record<Locale, string>>

function isNonemptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function getAttributeName(attributes: unknown): string | null {
  if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) {
    return null
  }

  const record = attributes as Record<string, unknown>

  for (const key of ['name', 'title', 'productName', 'product_name', 'label']) {
    if (isNonemptyString(record[key])) {
      return record[key].trim()
    }
  }

  return null
}

function hasMissingTitle(titles: LocalizedTitle): boolean {
  return LOCALES.some((locale) => !isNonemptyString(titles[locale]))
}

function deriveTitles(
  sku: string,
  attributes: unknown,
  existing: LocalizedTitle,
): Record<Locale, string> {
  const fromAnyLocale = LOCALES.map((locale) => existing[locale]).find(isNonemptyString)
  const fromAttributes = getAttributeName(attributes)
  const base = fromAnyLocale ?? fromAttributes ?? sku

  return {
    ro: existing.ro ?? base,
    da: existing.da ?? base,
    en: existing.en ?? base,
  }
}

async function getPayloadInstance() {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config.js')
  return getPayload({ config: await config })
}

async function loadStoredTitles(
  payload: Awaited<ReturnType<typeof getPayloadInstance>>,
): Promise<Map<number, LocalizedTitle>> {
  const titlesById = new Map<number, LocalizedTitle>()

  for (const locale of LOCALES) {
    const result = await payload.find({
      collection: 'products',
      locale,
      fallbackLocale: false,
      limit: 1000,
      pagination: false,
      depth: 0,
    })

    for (const doc of result.docs) {
      if (typeof doc.id !== 'number') {
        continue
      }

      const existing = titlesById.get(doc.id) ?? {}

      if (isNonemptyString(doc.title)) {
        existing[locale] = doc.title.trim()
      }

      titlesById.set(doc.id, existing)
    }
  }

  return titlesById
}

function countMissingTitles(titlesById: Map<number, LocalizedTitle>): number {
  let count = 0

  for (const titles of titlesById.values()) {
    if (hasMissingTitle(titles)) {
      count += 1
    }
  }

  return count
}

async function backfillProductTitles(dryRun: boolean): Promise<void> {
  if (!process.env.PAYLOAD_SECRET) {
    throw new Error('PAYLOAD_SECRET is not set in .env')
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in .env')
  }

  const payload = await getPayloadInstance()
  const titlesById = await loadStoredTitles(payload)
  const beforeMissing = countMissingTitles(titlesById)

  console.log(`Products missing title (before): ${beforeMissing}`)

  const products = await payload.find({
    collection: 'products',
    locale: 'ro',
    limit: 1000,
    pagination: false,
    depth: 0,
  })

  let updated = 0
  let skipped = 0

  for (const doc of products.docs) {
    if (typeof doc.id !== 'number' || !isNonemptyString(doc.sku)) {
      continue
    }

    const existing = titlesById.get(doc.id) ?? {}

    if (!hasMissingTitle(existing)) {
      skipped += 1
      continue
    }

    const titles = deriveTitles(doc.sku, doc.attributes, existing)

    if (dryRun) {
      console.log(`Would update ${doc.sku}: ${JSON.stringify(titles)}`)
      updated += 1
      continue
    }

    for (const locale of LOCALES) {
      if (isNonemptyString(existing[locale])) {
        continue
      }

      await payload.update({
        collection: 'products',
        id: doc.id,
        data: { title: titles[locale] },
        locale,
      })
    }

    console.log(`Updated: ${doc.sku} — ${titles.ro}`)
    updated += 1
  }

  const afterMissing = dryRun
    ? beforeMissing
    : countMissingTitles(await loadStoredTitles(payload))

  console.log('')
  console.log('=== Summary ===')
  console.log(`Total products: ${products.docs.length}`)
  console.log(`Updated: ${updated}`)
  console.log(`Skipped (already complete): ${skipped}`)
  console.log(`Products missing title (after): ${afterMissing}`)

  if (!dryRun && afterMissing > 0) {
    throw new Error(`${afterMissing} product(s) still missing title after backfill`)
  }
}

const dryRun = process.argv.includes('--dry-run')

backfillProductTitles(dryRun)
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('Backfill failed:', error)
    process.exit(1)
  })
