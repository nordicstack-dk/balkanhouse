import { getTranslations, setRequestLocale } from 'next-intl/server'

import { ProductGrid } from '@/components/products/ProductGrid'
import { CategoryNav } from '@/components/shop/CategoryNav'
import { SearchBar } from '@/components/shop/SearchBar'
import type { Locale } from '@/i18n/routing'
import {
  getActivePromotions,
  getCategories,
  getProducts,
} from '@/lib/storefront'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string }>
}

export const dynamic = 'force-dynamic'
export const revalidate = 60

export default async function ShopPage({ params, searchParams }: Props) {
  const { locale } = await params
  const { q } = await searchParams
  setRequestLocale(locale as Locale)

  const [t, categories, products, promotions] = await Promise.all([
    getTranslations('shop'),
    getCategories(locale as Locale),
    getProducts({ locale: locale as Locale, search: q }),
    getActivePromotions(),
  ])

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-text">{t('title')}</h1>
      <div className="mb-6">
        <SearchBar defaultValue={q} />
      </div>
      {q && (
        <p className="mb-4 text-sm text-text-muted">{t('resultsFor', { query: q })}</p>
      )}
      <div className="flex flex-col gap-8 md:flex-row">
        <CategoryNav categories={categories} />
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
