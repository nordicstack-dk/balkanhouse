import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { ProductGrid } from '@/components/products/ProductGrid'
import { CategoryNav } from '@/components/shop/CategoryNav'
import { SearchBar } from '@/components/shop/SearchBar'
import type { Locale } from '@/i18n/routing'
import {
  getActivePromotions,
  getCategories,
  getCategoryBySlug,
  getProducts,
} from '@/lib/storefront'

type Props = {
  params: Promise<{ locale: string; categorySlug: string }>
  searchParams: Promise<{ q?: string }>
}

export const dynamic = 'force-dynamic'
export const revalidate = 60

export default async function CategoryShopPage({ params, searchParams }: Props) {
  const { locale, categorySlug } = await params
  const { q } = await searchParams
  setRequestLocale(locale as Locale)

  const [category, categories, promotions, t] = await Promise.all([
    getCategoryBySlug(categorySlug, locale as Locale),
    getCategories(locale as Locale),
    getActivePromotions(),
    getTranslations('shop'),
  ])
  if (!category) notFound()

  const products = await getProducts({
    locale: locale as Locale,
    categoryId: category.id,
    search: q,
  })

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-text">{category.name}</h1>
      <div className="mb-6">
        <SearchBar defaultValue={q} />
      </div>
      <div className="flex flex-col gap-8 md:flex-row">
        <CategoryNav categories={categories} activeSlug={categorySlug} />
        <div className="min-w-0 flex-1">
          {products.length ? (
            <ProductGrid products={products} promotions={promotions} />
          ) : (
            <p className="text-text-muted">{t('noProducts')}</p>
          )}
        </div>
      </div>
    </div>
  )
}
