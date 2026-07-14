import { unstable_cache } from 'next/cache'
import type { Where } from 'payload'

import type { Locale } from '@/i18n/routing'
import type { Category, Media, Product, Promotion } from '@/payload-types'

import { getPayloadClient } from './payload'

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

export async function getProducts(options: {
  locale: Locale
  categoryId?: number
  search?: string
  limit?: number
}): Promise<ProductWithRelations[]> {
  const search = options.search?.trim()

  if (search) {
    return fetchProducts(options)
  }

  return unstable_cache(
    () => fetchProducts(options),
    [
      'storefront',
      'products',
      options.locale,
      String(options.categoryId ?? 'all'),
      String(options.limit ?? 100),
    ],
    { revalidate: REVALIDATE_SECONDS, tags: ['products'] },
  )()
}

async function fetchProducts(options: {
  locale: Locale
  categoryId?: number
  search?: string
  limit?: number
}): Promise<ProductWithRelations[]> {
  const payload = await getPayloadClient()
  const where: Where = {}

  if (options.categoryId) {
    where.category = { equals: options.categoryId }
  }

  if (options.search?.trim()) {
    where.title = { contains: options.search.trim() }
  }

  const result = await payload.find({
    collection: 'products',
    locale: options.locale,
    where,
    limit: options.limit ?? 100,
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
    return fetchProductsPage({ ...options, page })
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
  search?: string
  page: number
}): Promise<ProductListPage> {
  const payload = await getPayloadClient()
  const where: Where = {}

  if (options.categoryId) {
    where.category = { equals: options.categoryId }
  }

  if (options.search?.trim()) {
    where.title = { contains: options.search.trim() }
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

export { getPromoPercentForProduct, getPromotedProducts } from './promotions'
