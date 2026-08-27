'use client'

import { useTranslations } from 'next-intl'

import { usePathname } from '@/i18n/navigation'
import type { Category } from '@/payload-types'
import { OFFERS_SLUG } from '@/lib/promotions'

type ShopHeadingProps = {
  categories: Category[]
}

/**
 * The shop/category page title. Lives in the persistent shop layout and
 * derives its text from the current path + the already-loaded category
 * list, so switching categories updates the title instantly on the client
 * — no loading skeleton on the heading, only the product cards stream.
 */
export function ShopHeading({ categories }: ShopHeadingProps) {
  const t = useTranslations('shop')
  const pathname = usePathname()
  // next-intl's usePathname is locale-stripped: '/shop' or '/shop/<slug>'
  const slug = decodeURIComponent(pathname.split('/')[2] ?? '') || undefined

  let title = t('title')
  if (slug === OFFERS_SLUG) {
    // Offers is a static route, so it has no matching category document.
    title = t('offers')
  } else if (slug) {
    title = categories.find((c) => c.slug === slug)?.name ?? t('title')
  }

  return <h1 className="mb-8 text-4xl font-bold text-text md:text-5xl">{title}</h1>
}
