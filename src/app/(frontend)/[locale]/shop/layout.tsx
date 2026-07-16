import { Suspense } from 'react'
import { setRequestLocale } from 'next-intl/server'

import { CategoryNav } from '@/components/shop/CategoryNav'
import { SearchBar } from '@/components/shop/SearchBar'
import { ShopHeading } from '@/components/shop/ShopHeading'
import { Skeleton } from '@/components/ui/Skeleton'
import type { Locale } from '@/i18n/routing'
import { getCategories } from '@/lib/storefront'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

// Layouts persist across navigations within /shop, so the search bar and
// category sidebar stay mounted while only the product area (the page)
// streams through its loading boundary.
export default async function ShopLayout({ children, params }: Props) {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  const categories = await getCategories(locale as Locale)

  return (
    <div>
      <div className="mb-6">
        <Suspense fallback={<Skeleton className="h-10 w-full" />}>
          <SearchBar />
        </Suspense>
      </div>
      <div className="flex flex-col gap-8 md:flex-row">
        <CategoryNav categories={categories} />
        <div className="min-w-0 flex-1">
          <ShopHeading categories={categories} />
          {children}
        </div>
      </div>
    </div>
  )
}
