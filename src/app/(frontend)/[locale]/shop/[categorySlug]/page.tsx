import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { ProductGrid } from '@/components/products/ProductGrid'
import { Pagination } from '@/components/shop/Pagination'
import { assertLocale } from '@/i18n/locale-guard'
import {
  getActivePromotions,
  getCategoryBySlug,
  getProductsPage,
} from '@/lib/storefront'

type Props = {
  params: Promise<{ locale: string; categorySlug: string }>
  searchParams: Promise<{ q?: string; page?: string }>
}

// This page reads searchParams (?q=, ?page=) so it renders per request;
// the tagged storefront cache underneath keeps it fast. Search bar and
// category nav live in the persistent shop layout.

export default async function CategoryShopPage({ params, searchParams }: Props) {
  const { locale: rawLocale, categorySlug } = await params
  const { q, page: pageParam } = await searchParams
  const locale = assertLocale(rawLocale)
  setRequestLocale(locale)

  const requestedPage = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)

  const category = await getCategoryBySlug(categorySlug, locale)
  if (!category) notFound()

  // Paginated (audit F20): bounds per-page work regardless of how many products
  // the category holds, matching the flat shop page instead of loading the whole
  // category catalog into one render.
  const [t, productsPage, promotions] = await Promise.all([
    getTranslations('shop'),
    getProductsPage({
      locale,
      categoryId: category.id,
      search: q,
      page: requestedPage,
    }),
    getActivePromotions(),
  ])
  const { docs: products, page, totalPages } = productsPage

  return (
    <div>
      {q && (
        <p className="mb-4 text-sm text-text-muted">{t('resultsFor', { query: q })}</p>
      )}
      {products.length ? (
        <>
          <ProductGrid products={products} promotions={promotions} />
          <Pagination
            page={page}
            totalPages={totalPages}
            query={q}
            basePath={`/shop/${categorySlug}`}
          />
        </>
      ) : (
        <p className="text-text-muted">{t('noProducts')}</p>
      )}
    </div>
  )
}
