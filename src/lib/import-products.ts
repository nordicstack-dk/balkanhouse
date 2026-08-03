import fs from 'fs'
import path from 'path'
import type { Payload } from 'payload'

import type { AllergenEU, StockStatus, Unit } from '@/lib/contracts'
import { ALLERGEN_EU, STOCK_STATUS, UNIT } from '@/lib/contracts'
import { resolveMediaIdForSku } from '@/lib/product-image-link'

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
  /** Shared related-products keyword (e.g. bread). */
  keyword?: string
  /** Image file base name (without extension); defaults to the SKU. */
  image?: string
}

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'] as const

export type ImportProductsOptions = {
  dryRun?: boolean
  imagesDir?: string
  replaceImages?: boolean
}

export type ImportProductsResult = {
  rowCount: number
  created: number
  updated: number
  imagesAttached: number
  imagesMissing: string[]
  dryRun: boolean
  preview?: Array<{
    sku: string
    title: string
    priceDkk: number
    stockStatus: string
    imageNote: string
  }>
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
  const keywordRaw = getCell(row, 'keyword')
  const keyword = keywordRaw ? keywordRaw.trim().toLowerCase() : undefined
  const image = getCell(row, 'image', 'image_name', 'image_filename') || undefined

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
    keyword,
    image,
  }
}

function resolveImageFile(imagesDir: string, baseName: string): string | null {
  const existingExt = IMAGE_EXTENSIONS.find((ext) => baseName.toLowerCase().endsWith(ext))
  if (existingExt) {
    const direct = path.join(imagesDir, baseName)
    return fs.existsSync(direct) ? direct : null
  }

  for (const ext of IMAGE_EXTENSIONS) {
    const filePath = path.join(imagesDir, `${baseName}${ext}`)
    if (fs.existsSync(filePath)) {
      return filePath
    }
  }

  return null
}

async function upsertMedia(payload: Payload, imagePath: string, alt: string): Promise<number> {
  const fileName = path.basename(imagePath)

  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: fileName } },
    limit: 1,
  })

  const existingId = existing.docs[0]?.id
  if (typeof existingId === 'number') {
    return existingId
  }

  const created = await payload.create({
    collection: 'media',
    data: { alt },
    filePath: imagePath,
  })

  return created.id
}

function parseCsvRows(content: string): Record<string, string>[] {
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

async function parseXlsxRows(buffer: Buffer): Promise<Record<string, string>[]> {
  // xlsx@0.18 is CommonJS: under ESM only some helpers are re-exported as named
  // bindings (read is available on default), so go through the default export.
  const xlsxModule = await import('xlsx')
  const xlsx = xlsxModule.default ?? xlsxModule
  const workbook = xlsx.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]

  if (!sheetName) {
    return []
  }

  const sheet = workbook.Sheets[sheetName]
  const rawRows = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

  return rawRows.map((row) => {
    const normalized: Record<string, string> = {}

    for (const [key, value] of Object.entries(row)) {
      normalized[normalizeHeader(String(key))] = String(value ?? '').trim()
    }

    return normalized
  })
}

export async function readRowsFromBuffer(
  buffer: Buffer,
  filename: string,
): Promise<Record<string, string>[]> {
  const ext = path.extname(filename).toLowerCase()

  if (ext === '.csv') {
    return parseCsvRows(buffer.toString('utf8'))
  }

  if (ext === '.xlsx' || ext === '.xls') {
    return parseXlsxRows(buffer)
  }

  throw new Error(`Unsupported file type "${ext}". Use .xlsx or .csv`)
}

async function resolveCategoryId(payload: Payload, slug: string): Promise<number | undefined> {
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

/**
 * Import products from an Excel/CSV buffer. Returns a structured summary.
 */
export async function importProductsFromBuffer(
  payload: Payload,
  input: { buffer: Buffer; filename: string },
  options: ImportProductsOptions = {},
): Promise<ImportProductsResult> {
  const dryRun = Boolean(options.dryRun)
  const replaceImages = Boolean(options.replaceImages)
  const imagesDir = options.imagesDir

  if (imagesDir && !fs.existsSync(imagesDir)) {
    throw new Error(`Images directory not found: ${imagesDir}`)
  }

  const rawRows = await readRowsFromBuffer(input.buffer, input.filename)
  const rows = rawRows.map((row, index) => parseRow(row, index + 2))

  if (dryRun) {
    return {
      rowCount: rows.length,
      created: 0,
      updated: 0,
      imagesAttached: 0,
      imagesMissing: [],
      dryRun: true,
      preview: rows.map((row) => {
        const title = row.title.ro ?? row.title.da ?? row.title.en ?? '(no title)'
        const base = row.image ?? row.sku
        let imageNote = `Media/Blob lookup for ${base}`
        if (imagesDir) {
          const found = resolveImageFile(imagesDir, base)
          imageNote = found
            ? path.basename(found)
            : `NOT FOUND locally (would try Media/Blob for ${base})`
        }
        return {
          sku: row.sku,
          title,
          priceDkk: row.priceDkk,
          stockStatus: row.stockStatus,
          imageNote,
        }
      }),
    }
  }

  let created = 0
  let updated = 0
  let imagesAttached = 0
  const imagesMissing: string[] = []

  async function imagesFieldFor(
    row: ImportRow,
    existingImages: unknown,
  ): Promise<number[] | undefined> {
    const hasImages = Array.isArray(existingImages) && existingImages.length > 0
    if (hasImages && !replaceImages) return undefined

    const base = row.image ?? row.sku
    const alt = row.title.ro ?? row.title.en ?? row.title.da ?? row.sku

    if (imagesDir) {
      const imagePath = resolveImageFile(imagesDir, base)
      if (imagePath) {
        const mediaId = await upsertMedia(payload, imagePath, alt)
        imagesAttached += 1
        return [mediaId]
      }
    }

    const mediaId = await resolveMediaIdForSku(payload, base, { alt })
    if (mediaId != null) {
      imagesAttached += 1
      return [mediaId]
    }

    imagesMissing.push(row.sku)
    return undefined
  }

  for (const row of rows) {
    const category = row.categorySlug ? await resolveCategoryId(payload, row.categorySlug) : undefined

    const baseData = {
      sku: row.sku,
      priceDkk: row.priceDkk,
      unit: row.unit,
      stockStatus: row.stockStatus,
      allergens: row.allergens,
      countryOfOrigin: row.countryOfOrigin,
      ...(row.keyword ? { keyword: row.keyword } : {}),
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
      const images = await imagesFieldFor(row, existing.docs[0].images)

      await payload.update({
        collection: 'products',
        id,
        data: {
          ...baseData,
          ...(row.title.ro ? { title: row.title.ro } : {}),
          ...(images ? { images } : {}),
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
    } else {
      const images = await imagesFieldFor(row, undefined)

      const createdDoc = await payload.create({
        collection: 'products',
        data: {
          ...baseData,
          title: row.title.ro ?? row.sku,
          ingredients: row.ingredients.ro,
          description: row.description.ro ? toRichText(row.description.ro) : undefined,
          ...(images ? { images } : {}),
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
    }
  }

  return {
    rowCount: rows.length,
    created,
    updated,
    imagesAttached,
    imagesMissing,
    dryRun: false,
  }
}
