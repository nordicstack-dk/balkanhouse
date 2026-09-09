import fs from 'fs'
import path from 'path'
import type { Payload } from 'payload'

import type { AllergenEU, StockStatus, Unit } from '@/lib/contracts'
import { ALLERGEN_EU, STOCK_STATUS, UNIT, isMeasureUnit } from '@/lib/contracts'
import { createSkuImageResolver } from '@/lib/product-image-link'
import { normalizeForSearch } from '@/lib/search'
import { revalidateStorefrontTags } from '@/lib/revalidate-storefront'

type Locale = 'ro' | 'da' | 'en'
const LOCALES: Locale[] = ['ro', 'da', 'en']

interface ImportRow {
  sku: string
  title: Partial<Record<Locale, string>>
  priceDkk: number
  unit: Unit
  /** Net weight of one pack in grams; undefined leaves any existing value alone. */
  netWeightGrams?: number
  /** Net volume of one pack in millilitres; mutually exclusive with the weight. */
  netVolumeMl?: number
  /** A blank cell parses to 'hidden', so a half-filled row never goes on sale. */
  stockStatus: StockStatus
  categorySlug?: string
  /** Display name for a category the import has to create. */
  categoryName: Partial<Record<Locale, string>>
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
  /** First data row to write, 0-based. Rows before it are parsed but skipped. */
  offset?: number
  /** How many rows to write in this call. Omit to write the rest of the file. */
  limit?: number
}

export type ImportProductsResult = {
  rowCount: number
  created: number
  updated: number
  imagesAttached: number
  imagesMissing: string[]
  /** Category slugs that did not exist and were created by this import. */
  categoriesCreated: string[]
  dryRun: boolean
  /** Rows written by this call (a chunk, not the whole file). */
  processed: number
  /**
   * Where the next chunk starts, or null when the file is done. A serverless
   * function cannot write 600+ rows within its time limit, so the caller loops
   * on this instead of holding one long request open.
   */
  nextOffset: number | null
  preview?: Array<{
    sku: string
    title: string
    priceDkk: number
    stockStatus: string
    imageNote: string
  }>
}

/**
 * Writes go through Payload one row at a time, and the Products beforeChange
 * hook re-resolves images from Media + Vercel Blob on every save — ~2.6s each,
 * against ~0.24s with it skipped. The importer has already resolved images
 * itself by then, so this context flag turns that duplicate work off.
 *
 * revalidate is likewise pointless per row; the caller does it once at the end.
 */
const IMPORT_CONTEXT = { skipSkuImageAutoLink: true, skipStorefrontRevalidate: true } as const

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
    hidden: STOCK_STATUS.HIDDEN,
    ascuns: STOCK_STATUS.HIDDEN,
    'ascunse': STOCK_STATUS.HIDDEN,
    skjult: STOCK_STATUS.HIDDEN,
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

  if (normalized === UNIT.LITRE || normalized === 'liter' || normalized === 'litru' || normalized === 'l') {
    return UNIT.LITRE
  }

  throw new Error(`Invalid unit "${value}"`)
}

/**
 * Words meaning "this product has no allergens". Merchants write these instead
 * of leaving the cell empty, and rejecting them aborted the whole import.
 */
const ALLERGEN_NONE = new Set([
  'none',
  'no',
  'n/a',
  'na',
  '-',
  '--',
  '0',
  'nu',
  'niciunul',
  'nici unul',
  'fara',
  'fara alergeni',
  'ingen',
])

/**
 * Accepted spellings per EU allergen code, keyed in diacritic-free lowercase
 * (so "țelină" and "muștar" match after normalizeForSearch). Romanian and
 * Danish names are included because that is what the merchant types.
 *
 * Deliberately conservative: ambiguous words are left OUT so the import fails
 * loudly rather than guessing. "alune" is hazelnuts in most of Romania but
 * peanuts in "alune de pamant", and "scoici" covers both molluscs and
 * crustaceans — a wrong allergen is a safety problem, not a formatting one.
 */
const ALLERGEN_ALIASES: Record<string, AllergenEU> = {
  gluten: ALLERGEN_EU.GLUTEN,

  crustacee: ALLERGEN_EU.CRUSTACEANS,
  krebsdyr: ALLERGEN_EU.CRUSTACEANS,

  egg: ALLERGEN_EU.EGGS,
  ou: ALLERGEN_EU.EGGS,
  oua: ALLERGEN_EU.EGGS,
  aeg: ALLERGEN_EU.EGGS,

  peste: ALLERGEN_EU.FISH,
  fisk: ALLERGEN_EU.FISH,

  peanut: ALLERGEN_EU.PEANUTS,
  arahide: ALLERGEN_EU.PEANUTS,
  jordnodder: ALLERGEN_EU.PEANUTS,

  soy: ALLERGEN_EU.SOYBEANS,
  soybean: ALLERGEN_EU.SOYBEANS,
  soia: ALLERGEN_EU.SOYBEANS,
  soja: ALLERGEN_EU.SOYBEANS,
  sojabonner: ALLERGEN_EU.SOYBEANS,

  lapte: ALLERGEN_EU.MILK,
  lactoza: ALLERGEN_EU.MILK,
  laktose: ALLERGEN_EU.MILK,
  maelk: ALLERGEN_EU.MILK,

  nuci: ALLERGEN_EU.NUTS,
  'fructe cu coaja': ALLERGEN_EU.NUTS,
  nodder: ALLERGEN_EU.NUTS,

  telina: ALLERGEN_EU.CELERY,
  selleri: ALLERGEN_EU.CELERY,

  mustar: ALLERGEN_EU.MUSTARD,
  sennep: ALLERGEN_EU.MUSTARD,

  susan: ALLERGEN_EU.SESAME,
  sesam: ALLERGEN_EU.SESAME,

  sulfites: ALLERGEN_EU.SULPHITES,
  sulfiti: ALLERGEN_EU.SULPHITES,
  sulfitter: ALLERGEN_EU.SULPHITES,
  so2: ALLERGEN_EU.SULPHITES,
  'dioxid de sulf': ALLERGEN_EU.SULPHITES,

  lupine: ALLERGEN_EU.LUPIN,

  mollusks: ALLERGEN_EU.MOLLUSCS,
  moluste: ALLERGEN_EU.MOLLUSCS,
  bloddyr: ALLERGEN_EU.MOLLUSCS,
  muslinger: ALLERGEN_EU.MOLLUSCS,
}

export function parseAllergens(value: string): AllergenEU[] {
  if (!value.trim()) {
    return []
  }

  const canonical = new Set<string>(Object.values(ALLERGEN_EU))
  const result: AllergenEU[] = []

  for (const raw of value.split(',')) {
    // Diacritic-insensitive, so "țelină" and "mælk" resolve like the rest of
    // the storefront's text matching does.
    const item = normalizeForSearch(raw).trim().replace(/\s+/g, ' ')
    if (!item || ALLERGEN_NONE.has(item)) continue

    // An EU code, its plural-trimmed form, or a known local name.
    const resolved =
      (canonical.has(item) ? (item as AllergenEU) : undefined) ??
      ALLERGEN_ALIASES[item] ??
      (canonical.has(`${item}s`) ? (`${item}s` as AllergenEU) : undefined)

    if (!resolved) {
      throw new Error(
        `Invalid allergen "${raw.trim()}". Use an EU code (${Object.values(ALLERGEN_EU).join(', ')}), a known local name, or leave the cell empty.`,
      )
    }
    if (!result.includes(resolved)) result.push(resolved)
  }

  return result
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
  /**
   * parseUnit / parseStockStatus / parseAllergens don't know their row, so
   * their messages arrived without one — useless in a 600-row sheet, where the
   * whole import aborts on the first bad cell.
   */
  const at = <T>(parse: () => T): T => {
    try {
      return parse()
    } catch (err) {
      throw new Error(`Row ${lineNumber}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const sku = getCell(row, 'sku')
  if (!sku) {
    throw new Error(`Row ${lineNumber}: missing sku`)
  }

  const priceRaw = getCell(row, 'price_dkk', 'price')
  const priceDkk = Number(priceRaw)
  if (!priceRaw || Number.isNaN(priceDkk) || priceDkk < 0) {
    throw new Error(`Row ${lineNumber}: invalid price_dkk "${priceRaw}"`)
  }

  const unit = at(() => parseUnit(getCell(row, 'unit') || UNIT.PIECE))

  const positiveNumber = (raw: string, column: string): number | undefined => {
    if (!raw) return undefined
    const parsed = Number(String(raw).replace(',', '.'))
    if (Number.isNaN(parsed) || parsed <= 0) {
      throw new Error(`Row ${lineNumber}: invalid ${column} "${raw}"`)
    }
    return parsed
  }

  const netWeightGrams = positiveNumber(
    getCell(row, 'net_weight_g', 'net_weight', 'weight_g', 'gramaj'),
    'net_weight_g',
  )
  const netVolumeMl = positiveNumber(
    getCell(row, 'net_volume_ml', 'net_volume', 'volume_ml', 'volum'),
    'net_volume_ml',
  )

  // A product is sold by weight or by volume, never both — and a litre is not a
  // kilogram, so the two cannot be reconciled after the fact.
  if (netWeightGrams != null && netVolumeMl != null) {
    throw new Error(
      `Row ${lineNumber}: net_weight_g and net_volume_ml are both set — fill in only the one the product is sold by`,
    )
  }

  // On a per-measure product, price_dkk is already the price of one kilogram or
  // litre, so a pack size there means the price was almost certainly entered as
  // a pack price. Left through, it undercharges on every sale.
  if (isMeasureUnit(unit) && (netWeightGrams != null || netVolumeMl != null)) {
    throw new Error(
      `Row ${lineNumber}: unit is "${unit}", so price_dkk is already the price per ${unit} — clear net_weight_g/net_volume_ml, or set unit to "piece" and enter the pack price`,
    )
  }

  // A blank cell hides the product rather than defaulting it to "in stock":
  // silently putting a half-filled row on sale is the worse failure, and it
  // used to reset products the merchant had marked Epuizat in the admin.
  const stockRaw = getCell(row, 'stock_status')
  const stockStatus = stockRaw ? at(() => parseStockStatus(stockRaw)) : STOCK_STATUS.HIDDEN
  const categorySlug = getCell(row, 'category_slug', 'category') || undefined
  const categoryName = parseLocalizedField(row, 'category_name')
  const allergens = at(() => parseAllergens(getCell(row, 'allergens')))
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
    netWeightGrams,
    netVolumeMl,
    stockStatus,
    categorySlug,
    categoryName,
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

async function findCategoryId(payload: Payload, slug: string): Promise<number | undefined> {
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
 * "paine-si-produse-de-panificatie" -> "Paine si produse de panificatie".
 *
 * A slug cannot carry diacritics or capitalisation, so this is a placeholder
 * the merchant renames in the admin. Give the sheet a `category_name` column to
 * set a proper name at import time instead.
 */
function categoryNameFromSlug(slug: string): string {
  const words = slug.replace(/[-_]+/g, ' ').trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/**
 * Creates the category if the slug is new, rather than silently dropping it.
 * An unknown slug used to leave the product with no category at all and no
 * warning — 170 rows of this catalogue landed that way.
 *
 * `name` and `slug` are both localized and required. Only Romanian is written
 * unless the sheet supplies the others; the config has `fallback: true`, so the
 * Danish and English storefronts show the Romanian name until it is translated.
 */
async function createCategory(
  payload: Payload,
  slug: string,
  names: Partial<Record<Locale, string>>,
): Promise<number> {
  const doc = await payload.create({
    collection: 'categories',
    locale: 'ro',
    data: { slug, name: names.ro || categoryNameFromSlug(slug) },
  })

  for (const locale of LOCALES) {
    if (locale === 'ro' || !names[locale]) continue
    await payload.update({
      collection: 'categories',
      id: doc.id,
      locale,
      data: { slug, name: names[locale]! },
    })
  }

  return doc.id as number
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

  const rowsBySku = new Map<string, number[]>()
  rows.forEach((row, index) => {
    rowsBySku.set(row.sku, [...(rowsBySku.get(row.sku) ?? []), index + 2])
  })
  const duplicateSkus = [...rowsBySku.entries()]
    .filter(([, at]) => at.length > 1)
    .map(([sku, at]) => ({ sku, rows: at }))

  // SKU is the product's identity and its URL, so two rows sharing one means
  // the later silently replaces the earlier — losing a product outright when
  // they are different goods that happen to share a barcode. Refuse the file
  // rather than write a result the merchant cannot see is wrong.
  if (duplicateSkus.length > 0) {
    const shown = duplicateSkus
      .slice(0, 10)
      .map(({ sku, rows: at }) => `  ${sku} — rows ${at.join(', ')}`)
      .join('\n')
    const more =
      duplicateSkus.length > 10 ? `\n  …and ${duplicateSkus.length - 10} more` : ''
    throw new Error(
      `${duplicateSkus.length} duplicate SKU(s) in the file. Each SKU must appear on one row only — otherwise the last row silently replaces the earlier product.\n${shown}${more}`,
    )
  }

  if (dryRun) {
    return {
      rowCount: rows.length,
      created: 0,
      updated: 0,
      imagesAttached: 0,
      imagesMissing: [],
      categoriesCreated: [],
      dryRun: true,
      processed: 0,
      nextOffset: null,
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
          // Spell out the blank case, so the merchant sees which rows the
          // import would take off the storefront before committing.
          stockStatus:
            row.stockStatus === STOCK_STATUS.HIDDEN
              ? 'ascuns (nu apare în magazin)'
              : row.stockStatus,
          imageNote,
        }
      }),
    }
  }

  let created = 0
  let updated = 0
  let imagesAttached = 0
  const categoriesCreated: string[] = []
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

    const mediaId = await resolveSkuImage(base, { alt })
    if (mediaId != null) {
      imagesAttached += 1
      return [mediaId]
    }

    imagesMissing.push(row.sku)
    return undefined
  }

  // Only this slice is written; the rest of the file is parsed (cheap, and it
  // still validates every row up front) but left to the next call.
  const offset = Math.max(0, Math.floor(options.offset ?? 0))
  const limit = options.limit != null ? Math.max(1, Math.floor(options.limit)) : rows.length
  const chunk = rows.slice(offset, offset + limit)
  const nextOffset = offset + chunk.length < rows.length ? offset + chunk.length : null

  // One query for every SKU in the chunk, instead of one per row.
  const existingBySku = new Map<string, { id: number; images?: unknown }>()
  if (chunk.length) {
    const found = await payload.find({
      collection: 'products',
      where: { sku: { in: chunk.map((r) => r.sku) } },
      limit: chunk.length,
      pagination: false,
      depth: 0,
    })
    for (const doc of found.docs) {
      existingBySku.set(String(doc.sku), { id: doc.id as number, images: doc.images })
    }
  }

  // A few distinct categories across hundreds of rows; look each up once.
  // Media + blob indexes built once, so a SKU with no picture costs nothing
  // instead of eight failed round trips.
  const resolveSkuImage = await createSkuImageResolver(payload)

  // A few distinct categories across hundreds of rows: look each up once, and
  // create the ones that do not exist yet.
  const categoryCache = new Map<string, number | undefined>()
  const categoryIdFor = async (
    slug: string,
    names: Partial<Record<Locale, string>>,
  ): Promise<number | undefined> => {
    if (categoryCache.has(slug)) return categoryCache.get(slug)

    let id = await findCategoryId(payload, slug)
    if (id == null) {
      id = await createCategory(payload, slug, names)
      categoriesCreated.push(slug)
    }
    categoryCache.set(slug, id)
    return id
  }

  for (const row of chunk) {
    const category = row.categorySlug
      ? await categoryIdFor(row.categorySlug, row.categoryName)
      : undefined

    const baseData = {
      sku: row.sku,
      priceDkk: row.priceDkk,
      unit: row.unit,
      stockStatus: row.stockStatus,
      allergens: row.allergens,
      countryOfOrigin: row.countryOfOrigin,
      // Blank cells leave an existing value alone, matching keyword/category.
      ...(row.netWeightGrams != null ? { netWeightGrams: row.netWeightGrams } : {}),
      ...(row.netVolumeMl != null ? { netVolumeMl: row.netVolumeMl } : {}),
      ...(row.keyword ? { keyword: row.keyword } : {}),
      ...(category ? { category } : {}),
    }

    const existing = existingBySku.get(row.sku)

    if (existing) {
      const id = existing.id
      const images = await imagesFieldFor(row, existing.images)

      await payload.update({
        collection: 'products',
        id,
        data: {
          ...baseData,
          ...(row.title.ro ? { title: row.title.ro } : {}),
          ...(images ? { images } : {}),
        },
        locale: 'ro',
        context: IMPORT_CONTEXT,
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
            context: IMPORT_CONTEXT,
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
        context: IMPORT_CONTEXT,
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
            context: IMPORT_CONTEXT,
          })
        }
      }

      // Defensive: duplicates are rejected up front, but if that ever changes a
      // later row with the same SKU must update this record, not re-create it.
      existingBySku.set(row.sku, { id: createdDoc.id as number, images: undefined })
      created += 1
    }
  }

  // Revalidated once here rather than on each write, and only when the file is
  // finished, so the storefront doesn't churn between chunks.
  if (nextOffset === null && chunk.length > 0) {
    revalidateStorefrontTags('products', 'promotions')
  }

  return {
    rowCount: rows.length,
    created,
    updated,
    imagesAttached,
    imagesMissing,
    categoriesCreated,
    processed: chunk.length,
    nextOffset,
    dryRun: false,
  }
}
