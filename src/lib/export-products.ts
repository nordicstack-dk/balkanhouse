import type { Payload } from 'payload'

import { STOCK_STATUS } from '@/lib/contracts'

type Locale = 'ro' | 'da' | 'en'
const LOCALES: Locale[] = ['ro', 'da', 'en']

/**
 * Column order matches the sheet the merchant already works in, so an exported
 * file and a hand-built one are interchangeable. Every header here is one the
 * importer reads, which is what makes the round trip work.
 */
export const EXPORT_COLUMNS = [
  'sku',
  'title_ro',
  'title_da',
  'title_en',
  'price_dkk',
  'net_volume_ml',
  'net_weight_g',
  'unit',
  'stock_status',
  'category_slug',
  'allergens',
  'ingredients_ro',
  'ingredients_da',
  'ingredients_en',
  'description_ro',
  'description_da',
  'description_en',
  'image',
  'keyword',
  'country_of_origin',
] as const

type LexicalNode = { text?: string; children?: LexicalNode[]; type?: string }

/**
 * Flattens Lexical back to the plain text the importer turns into rich text.
 * Paragraphs become newlines; any other formatting is lost, which is why the
 * export is a data round trip and not a document one.
 */
function richTextToPlain(value: unknown): string {
  const root = (value as { root?: { children?: LexicalNode[] } } | null)?.root
  if (!root?.children) return ''

  const lineFor = (nodes: LexicalNode[] | undefined): string =>
    (nodes ?? [])
      .map((node) => (typeof node.text === 'string' ? node.text : lineFor(node.children)))
      .join('')

  return root.children
    .map((node) => lineFor(node.children))
    .filter((line) => line.trim())
    .join('\n')
}

/** A localized field read with `locale: 'all'` comes back keyed by locale. */
function localized(value: unknown, locale: Locale): unknown {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return (value as Record<string, unknown>)[locale]
  }
  return locale === 'ro' ? value : undefined
}

function textFor(value: unknown, locale: Locale): string {
  const v = localized(value, locale)
  return typeof v === 'string' ? v : ''
}

export type ExportRow = Record<(typeof EXPORT_COLUMNS)[number], string | number>

/**
 * Every product as importer-shaped rows. Hidden products are included: the
 * point of the export is to bulk-edit the catalogue, and the hidden ones are
 * usually the ones needing attention.
 */
export async function buildProductExportRows(payload: Payload): Promise<ExportRow[]> {
  const result = await payload.find({
    collection: 'products',
    locale: 'all' as never,
    depth: 1,
    pagination: false,
    limit: 0,
    sort: 'sku',
  })

  return result.docs.map((doc) => {
    const d = doc as unknown as Record<string, unknown>

    const category = d.category as { slug?: unknown } | number | null | undefined
    const categorySlug =
      category && typeof category === 'object'
        ? String(localized((category as { slug?: unknown }).slug, 'ro') ?? '')
        : ''

    // The importer treats `image` as a filename stem and falls back to the SKU,
    // so export the stem only when it differs from what that fallback gives.
    const images = Array.isArray(d.images) ? d.images : []
    const first = images[0] as { filename?: unknown } | number | undefined
    const filename =
      first && typeof first === 'object' && typeof first.filename === 'string'
        ? first.filename.replace(/\.[^.]+$/, '')
        : ''

    const row = {
      sku: String(d.sku ?? ''),
      price_dkk: typeof d.priceDkk === 'number' ? d.priceDkk : '',
      net_volume_ml: typeof d.netVolumeMl === 'number' ? d.netVolumeMl : '',
      net_weight_g: typeof d.netWeightGrams === 'number' ? d.netWeightGrams : '',
      unit: String(d.unit ?? ''),
      // Round-trips as-is: 'hidden' is a value the importer accepts.
      stock_status: String(d.stockStatus ?? STOCK_STATUS.HIDDEN),
      category_slug: categorySlug,
      allergens: Array.isArray(d.allergens) ? d.allergens.join(',') : '',
      image: filename === String(d.sku ?? '') ? '' : filename,
      keyword: typeof d.keyword === 'string' ? d.keyword : '',
      country_of_origin: typeof d.countryOfOrigin === 'string' ? d.countryOfOrigin : '',
    } as ExportRow

    for (const locale of LOCALES) {
      row[`title_${locale}` as keyof ExportRow] = textFor(d.title, locale)
      row[`ingredients_${locale}` as keyof ExportRow] = textFor(d.ingredients, locale)
      row[`description_${locale}` as keyof ExportRow] = richTextToPlain(
        localized(d.description, locale),
      )
    }

    return row
  })
}

/** The rows as an .xlsx buffer, ready to hand back from a route. */
export async function buildProductExportWorkbook(payload: Payload): Promise<Buffer> {
  const rows = await buildProductExportRows(payload)

  // xlsx@0.18 is CommonJS; under ESM only some helpers are re-exported as named.
  const xlsxModule = await import('xlsx')
  const xlsx = xlsxModule.default ?? xlsxModule

  const sheet = xlsx.utils.json_to_sheet(rows, { header: [...EXPORT_COLUMNS] })
  sheet['!cols'] = EXPORT_COLUMNS.map((c) =>
    c.startsWith('description') || c.startsWith('ingredients')
      ? { wch: 34 }
      : c.startsWith('title')
        ? { wch: 40 }
        : { wch: 15 },
  )
  sheet['!freeze'] = { xSplit: '1', ySplit: '1' }

  const workbook = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(workbook, sheet, 'Products')
  return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer
}
