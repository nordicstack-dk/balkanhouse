import { unstable_cache } from 'next/cache'
import type { Where } from 'payload'

import type { Locale } from '@/i18n/routing'
import { STOCK_STATUS } from '@/lib/contracts'
import type { About, Category, Contact, Faq, Media, Product, Promotion, Setting } from '@/payload-types'

import { getPayloadClient } from './payload'
import { matchesSearch } from './search'
import { searchProductIds } from './search-db'

export type ProductWithRelations = Product & {
  category?: Category | null
  images?: Media[] | null
}

// Collection hooks call revalidateTag on every CMS change (see src/lib/revalidate-storefront.ts),
// so this TTL is only a fallback; promotions still activate/expire within this window.
const REVALIDATE_SECONDS = 300

export const SHOP_PAGE_SIZE = 24

export async function getCategories(locale: Locale): Promise<Category[]> {
  return unstable_cache(
    async () => {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'categories',
        locale,
        limit: 100,
        sort: 'name',
        depth: 1,
      })
      return result.docs
    },
    ['storefront', 'categories', locale],
    { revalidate: REVALIDATE_SECONDS, tags: ['categories'] },
  )()
}

export async function getCategoryBySlug(
  slug: string,
  locale: Locale,
): Promise<Category | null> {
  return unstable_cache(
    async () => {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'categories',
        locale,
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 1,
      })
      return result.docs[0] ?? null
    },
    ['storefront', 'category', slug, locale],
    { revalidate: REVALIDATE_SECONDS, tags: ['categories'] },
  )()
}

function cachedCatalog(options: {
  locale: Locale
  categoryId?: number
  limit?: number
}): Promise<ProductWithRelations[]> {
  return unstable_cache(
    () => fetchProducts(options),
    [
      'storefront',
      'products',
      options.locale,
      String(options.categoryId ?? 'all'),
      String(options.limit ?? 'unbounded'),
    ],
    { revalidate: REVALIDATE_SECONDS, tags: ['products'] },
  )()
}

/** Load full product docs (with relations) for the given IDs, preserving order. */
async function loadProductsByIds(
  locale: Locale,
  ids: number[],
): Promise<ProductWithRelations[]> {
  if (!ids.length) return []
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'products',
    locale,
    where: { id: { in: ids } },
    depth: 1,
    limit: ids.length,
    pagination: false,
  })
  const byId = new Map((result.docs as ProductWithRelations[]).map((d) => [d.id, d]))
  return ids.map((id) => byId.get(id)).filter(Boolean) as ProductWithRelations[]
}

async function fetchProducts(options: {
  locale: Locale
  categoryId?: number
  limit?: number
}): Promise<ProductWithRelations[]> {
  const payload = await getPayloadClient()
  const where: Where = {}

  if (options.categoryId) {
    where.category = { equals: options.categoryId }
  }

  const result = await payload.find({
    collection: 'products',
    locale: options.locale,
    where,
    // No explicit limit -> fetch the entire catalog in one query, so the
    // cached list (and search over it) is always complete regardless of size.
    ...(options.limit ? { limit: options.limit } : { pagination: false, limit: 0 }),
    depth: 1,
    sort: 'title',
  })

  return result.docs as ProductWithRelations[]
}

export type ProductListPage = {
  docs: ProductWithRelations[]
  page: number
  totalPages: number
}

export async function getProductsPage(options: {
  locale: Locale
  categoryId?: number
  search?: string
  page?: number
}): Promise<ProductListPage> {
  const search = options.search?.trim()
  const page = Math.max(1, Math.floor(options.page ?? 1))

  if (search) {
    // Diacritic-insensitive + typo-tolerant search, paginated at the database.
    try {
      const { ids, total } = await searchProductIds(options.locale, {
        search,
        categoryId: options.categoryId,
        limit: SHOP_PAGE_SIZE,
        offset: (page - 1) * SHOP_PAGE_SIZE,
      })
      return {
        docs: await loadProductsByIds(options.locale, ids),
        page,
        totalPages: Math.max(1, Math.ceil(total / SHOP_PAGE_SIZE)),
      }
    } catch (err) {
      console.warn(
        '[search] DB search unavailable, using in-memory fallback:',
        err instanceof Error ? err.message : err,
      )
      const base = await cachedCatalog({ locale: options.locale, categoryId: options.categoryId })
      const filtered = base.filter((product) => matchesSearch(product.title, search))
      return {
        docs: filtered.slice((page - 1) * SHOP_PAGE_SIZE, page * SHOP_PAGE_SIZE),
        page,
        totalPages: Math.max(1, Math.ceil(filtered.length / SHOP_PAGE_SIZE)),
      }
    }
  }

  return unstable_cache(
    () => fetchProductsPage({ ...options, page }),
    [
      'storefront',
      'products-page',
      options.locale,
      String(options.categoryId ?? 'all'),
      String(page),
    ],
    { revalidate: REVALIDATE_SECONDS, tags: ['products'] },
  )()
}

async function fetchProductsPage(options: {
  locale: Locale
  categoryId?: number
  page: number
}): Promise<ProductListPage> {
  const payload = await getPayloadClient()
  const where: Where = {}

  if (options.categoryId) {
    where.category = { equals: options.categoryId }
  }

  const result = await payload.find({
    collection: 'products',
    locale: options.locale,
    where,
    limit: SHOP_PAGE_SIZE,
    page: options.page,
    depth: 1,
    sort: 'title',
  })

  return {
    docs: result.docs as ProductWithRelations[],
    page: result.page ?? options.page,
    totalPages: result.totalPages ?? 1,
  }
}

export async function getProductBySku(
  sku: string,
  locale: Locale,
): Promise<ProductWithRelations | null> {
  return unstable_cache(
    async () => {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'products',
        locale,
        where: { sku: { equals: sku } },
        limit: 1,
        depth: 1,
      })
      return (result.docs[0] as ProductWithRelations) ?? null
    },
    ['storefront', 'product', sku, locale],
    { revalidate: REVALIDATE_SECONDS, tags: ['products'] },
  )()
}

/**
 * Other products that share the same related-products keyword (excluding the
 * current product). Empty keyword or no matches → empty list.
 */
export async function getRelatedProductsByKeyword(
  keyword: string | null | undefined,
  excludeProductId: number,
  locale: Locale,
  limit = 8,
): Promise<ProductWithRelations[]> {
  const normalized = keyword?.trim().toLowerCase()
  if (!normalized) return []

  return unstable_cache(
    async () => {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'products',
        locale,
        where: {
          and: [
            { keyword: { equals: normalized } },
            { id: { not_equals: excludeProductId } },
            { stockStatus: { not_equals: STOCK_STATUS.OUT } },
          ],
        },
        limit,
        depth: 1,
        sort: 'title',
      })
      return result.docs as ProductWithRelations[]
    },
    ['storefront', 'related', normalized, String(excludeProductId), locale, String(limit)],
    { revalidate: REVALIDATE_SECONDS, tags: ['products'] },
  )()
}

export async function getActivePromotions(): Promise<Promotion[]> {
  return unstable_cache(
    async () => {
      const payload = await getPayloadClient()
      const now = new Date().toISOString()

      const result = await payload.find({
        collection: 'promotions',
        where: {
          and: [
            { startDate: { less_than_equal: now } },
            { endDate: { greater_than_equal: now } },
          ],
        },
        // depth 2 is required here: promotion -> product -> images must all be
        // populated so the homepage carousel can render product cards with images.
        limit: 50,
        depth: 2,
      })

      return result.docs
    },
    ['storefront', 'promotions'],
    { revalidate: REVALIDATE_SECONDS, tags: ['promotions'] },
  )()
}

/**
 * Fetch a Payload global with graceful degradation. If the underlying table is
 * missing (e.g. the schema hasn't been pushed to this database yet) or the DB is
 * momentarily unavailable, return an empty fallback doc instead of throwing, so
 * the storefront still renders (pages fall back to bundled translations). The
 * error is not cached, so it recovers automatically once the DB is ready — this
 * also keeps `next build` prerendering from failing on a fresh database.
 */
async function loadGlobalCached<T>(
  cacheKey: string[],
  fetcher: () => Promise<T>,
  fallback: T,
  label: string,
): Promise<T> {
  try {
    return await unstable_cache(fetcher, cacheKey, {
      revalidate: REVALIDATE_SECONDS,
      tags: ['pages'],
    })()
  } catch (err) {
    console.warn(
      `[storefront] "${label}" global unavailable, using fallback:`,
      err instanceof Error ? err.message : err,
    )
    return fallback
  }
}

/**
 * Static-page content stored in Payload globals. These are localized, so each
 * language can have its own copy. Cached under the shared 'pages' tag, which the
 * global afterChange hooks invalidate on every edit.
 */
export async function getAboutContent(locale: Locale): Promise<About> {
  return loadGlobalCached(
    ['storefront', 'about', locale],
    async () => {
      const payload = await getPayloadClient()
      return payload.findGlobal({ slug: 'about', locale, depth: 0 })
    },
    { id: 0 } as About,
    'about',
  )
}

export async function getFaqContent(locale: Locale): Promise<Faq> {
  return loadGlobalCached(
    ['storefront', 'faq', locale],
    async () => {
      const payload = await getPayloadClient()
      return payload.findGlobal({ slug: 'faq', locale, depth: 0 })
    },
    { id: 0 } as Faq,
    'faq',
  )
}

/**
 * Site-wide settings (support email/phone). Not localized, so no locale needed.
 * Cached under the shared 'pages' tag, invalidated by the global's afterChange hook.
 */
export async function getSiteSettings(): Promise<Setting> {
  return loadGlobalCached(
    ['storefront', 'settings'],
    async () => {
      const payload = await getPayloadClient()
      return payload.findGlobal({ slug: 'settings', depth: 0 })
    },
    { id: 0, email: null, phone: null } as Setting,
    'settings',
  )
}

export async function getContactContent(locale: Locale): Promise<Contact> {
  return loadGlobalCached(
    ['storefront', 'contact', locale],
    async () => {
      const payload = await getPayloadClient()
      return payload.findGlobal({ slug: 'contact', locale, depth: 0 })
    },
    { id: 0 } as Contact,
    'contact',
  )
}

export { getPromoPercentForProduct, getPromotedProducts } from './promotions'
