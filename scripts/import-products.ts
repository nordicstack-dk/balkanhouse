import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import type { AllergenEU, StockStatus, Unit } from '../src/lib/contracts/index.js'
import { ALLERGEN_EU, STOCK_STATUS, UNIT } from '../src/lib/contracts/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

type Locale = 'ro' | 'da' | 'en'
const LOCALES: Locale[] = ['ro', 'da', 'en']

interface ImportRow {
  sku: string
  title: Partial<Record<Locale, string>>
  priceDkk: number
  unit: Unit
  stockStatus: StockStatus
  categorySlug?: string
  allergens: AllergenEU[]
  ingredients: Partial<Record<Locale, string>>
  description: Partial<Record<Locale, string>>
  countryOfOrigin?: string
  attributes?: Record<string, unknown>
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, '_')
}

function parseStockStatus(value: string): StockStatus {
  const normalized = value.trim().toLowerCase()

  const aliases: Record<string, StockStatus> = {
    in: STOCK_STATUS.IN,
    low: STOCK_STATUS.LOW,
    out: STOCK_STATUS.OUT,
    'în stoc': STOCK_STATUS.IN,
    'in stoc': STOCK_STATUS.IN,
    'stoc redus': STOCK_STATUS.LOW,
    epuizat: STOCK_STATUS.OUT,
  }

  const status = aliases[normalized]
  if (!status) {
    throw new Error(`Invalid stock_status "${value}"`)
  }

  return status
}

function parseUnit(value: string): Unit {
  const normalized = value.trim().toLowerCase()

  if (normalized === UNIT.PIECE || normalized === 'buc' || normalized === 'bucată') {
    return UNIT.PIECE
  }

  if (normalized === UNIT.KG || normalized === 'kilogram') {
    return UNIT.KG
  }

  throw new Error(`Invalid unit "${value}"`)
}

function parseAllergens(value: string): AllergenEU[] {
  if (!value.trim()) {
    return []
  }

  const valid = new Set<string>(Object.values(ALLERGEN_EU))

  return value
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .map((item) => {
      if (!valid.has(item)) {
        throw new Error(`Invalid allergen "${item}"`)
      }

      return item as AllergenEU
    })
}

function toRichText(text: string) {
  return {
    root: {
      type: 'root',
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
      children: [
        {
          type: 'paragraph',
          version: 1,
          children: [{ type: 'text', text, version: 1 }],
        },
      ],
    },
  }
}

function getCell(row: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[normalizeHeader(key)]
    if (value !== undefined && value !== '') {
      return value
    }
  }

  return ''
}

function parseLocalizedField(
  row: Record<string, string>,
  baseName: string,
): Partial<Record<Locale, string>> {
  const result: Partial<Record<Locale, string>> = {}

  for (const locale of LOCALES) {
    const value = getCell(row, `${baseName}_${locale}`)
    if (value) {
      result[locale] = value
    }
  }

  const defaultValue = getCell(row, baseName)
  if (defaultValue) {
    result.ro = defaultValue
  }

  return result
}

function parseRow(row: Record<string, string>, lineNumber: number): ImportRow {
  const sku = getCell(row, 'sku')
  if (!sku) {
    throw new Error(`Row ${lineNumber}: missing sku`)
  }

  const priceRaw = getCell(row, 'price_dkk', 'price')
  const priceDkk = Number(priceRaw)
  if (!priceRaw || Number.isNaN(priceDkk) || priceDkk < 0) {
    throw new Error(`Row ${lineNumber}: invalid price_dkk "${priceRaw}"`)
  }

  const unit = parseUnit(getCell(row, 'unit') || UNIT.PIECE)
  const stockStatus = parseStockStatus(getCell(row, 'stock_status') || STOCK_STATUS.IN)
  const categorySlug = getCell(row, 'category_slug', 'category') || undefined
  const allergens = parseAllergens(getCell(row, 'allergens'))
  const title = parseLocalizedField(row, 'title')
  const ingredients = parseLocalizedField(row, 'ingredients')
  const description = parseLocalizedField(row, 'description')
  const countryOfOrigin = getCell(row, 'country_of_origin') || undefined

  let attributes: Record<string, unknown> | undefined
  const attributesRaw = getCell(row, 'attributes')
  if (attributesRaw) {
    try {
      attributes = JSON.parse(attributesRaw) as Record<string, unknown>
    } catch {
      throw new Error(`Row ${lineNumber}: invalid attributes JSON`)
    }
  }

  return {
    sku,
    title,
    priceDkk,
    unit,
    stockStatus,
    categorySlug,
    allergens,
    ingredients,
    description,
    countryOfOrigin,
    attributes,
  }
}

async function readRows(filePath: string): Promise<Record<string, string>[]> {
  const ext = path.extname(filePath).toLowerCase()

  if (ext === '.csv') {
    const content = fs.readFileSync(filePath, 'utf8')
    const lines = content.split(/\r?\n/).filter((line) => line.trim())

    if (lines.length < 2) {
      return []
    }

    const headers = lines[0].split(',').map(normalizeHeader)

    return lines.slice(1).map((line) => {
      const values = line.split(',')
      const row: Record<string, string> = {}

      headers.forEach((header, index) => {
        row[header] = (values[index] ?? '').trim()
      })

      return row
    })
  }

  const { readFile, utils } = await import('xlsx')
  const workbook = readFile(filePath)
  const sheetName = workbook.SheetNames[0]

  if (!sheetName) {
    return []
  }

  const sheet = workbook.Sheets[sheetName]
  const rawRows = utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

  return rawRows.map((row) => {
    const normalized: Record<string, string> = {}

    for (const [key, value] of Object.entries(row)) {
      normalized[normalizeHeader(String(key))] = String(value ?? '').trim()
    }

    return normalized
  })
}

async function resolveCategoryId(
  payload: Awaited<ReturnType<typeof getPayloadInstance>>,
  slug: string,
): Promise<number | undefined> {
  const result = await payload.find({
    collection: 'categories',
    locale: 'ro',
    where: {
      slug: {
        equals: slug,
      },
    },
    limit: 1,
  })

  const id = result.docs[0]?.id
  return typeof id === 'number' ? id : undefined
}

async function getPayloadInstance() {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config.js')
  return getPayload({ config: await config })
}

async function importProducts(filePath: string, dryRun: boolean): Promise<void> {
  if (!process.env.PAYLOAD_SECRET) {
    throw new Error('PAYLOAD_SECRET is not set in .env')
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in .env')
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }

  const rawRows = await readRows(filePath)
  const rows = rawRows.map((row, index) => parseRow(row, index + 2))

  console.log(`Parsed ${rows.length} product row(s) from ${path.basename(filePath)}`)

  if (dryRun) {
    console.log('Dry run — no database writes')
    rows.forEach((row) => {
      const title = row.title.ro ?? row.title.da ?? row.title.en ?? '(no title)'
      console.log(`  ${row.sku} | ${title} | ${row.priceDkk} DKK | ${row.stockStatus}`)
    })
    return
  }

  const payload = await getPayloadInstance()
  let created = 0
  let updated = 0

  for (const row of rows) {
    const category = row.categorySlug ? await resolveCategoryId(payload, row.categorySlug) : undefined

    const baseData = {
      sku: row.sku,
      priceDkk: row.priceDkk,
      unit: row.unit,
      stockStatus: row.stockStatus,
      allergens: row.allergens,
      countryOfOrigin: row.countryOfOrigin,
      attributes: row.attributes,
      ...(category ? { category } : {}),
    }

    const existing = await payload.find({
      collection: 'products',
      where: {
        sku: {
          equals: row.sku,
        },
      },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      const id = existing.docs[0].id

      await payload.update({
        collection: 'products',
        id,
        data: {
          ...baseData,
          ...(row.title.ro ? { title: row.title.ro } : {}),
        },
        locale: 'ro',
      })

      for (const locale of LOCALES) {
        const localizedData: Record<string, unknown> = {}

        if (row.title[locale]) {
          localizedData.title = row.title[locale]
        }

        if (row.ingredients[locale]) {
          localizedData.ingredients = row.ingredients[locale]
        }

        if (row.description[locale]) {
          localizedData.description = toRichText(row.description[locale]!)
        }

        if (Object.keys(localizedData).length > 0) {
          await payload.update({
            collection: 'products',
            id,
            data: localizedData,
            locale,
          })
        }
      }

      updated += 1
      console.log(`Updated: ${row.sku}`)
    } else {
      const createdDoc = await payload.create({
        collection: 'products',
        data: {
          ...baseData,
          title: row.title.ro ?? row.sku,
          ingredients: row.ingredients.ro,
          description: row.description.ro ? toRichText(row.description.ro) : undefined,
        },
        locale: 'ro',
      })

      for (const locale of LOCALES) {
        if (locale === 'ro') {
          continue
        }

        const localizedData: Record<string, unknown> = {}

        if (row.title[locale]) {
          localizedData.title = row.title[locale]
        }

        if (row.ingredients[locale]) {
          localizedData.ingredients = row.ingredients[locale]
        }

        if (row.description[locale]) {
          localizedData.description = toRichText(row.description[locale]!)
        }

        if (Object.keys(localizedData).length > 0) {
          await payload.update({
            collection: 'products',
            id: createdDoc.id,
            data: localizedData,
            locale,
          })
        }
      }

      created += 1
      console.log(`Created: ${row.sku}`)
    }
  }

  console.log(`Done. Created: ${created}, updated: ${updated}`)
}

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const fileArg = args.find((arg) => !arg.startsWith('--'))

if (!fileArg) {
  console.error('Usage: pnpm import:products -- <file.xlsx|file.csv> [--dry-run]')
  process.exit(1)
}

importProducts(path.resolve(fileArg), dryRun)
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('Import failed:', error)
    process.exit(1)
  })
