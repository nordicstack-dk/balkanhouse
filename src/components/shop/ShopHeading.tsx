'use client'

import { useTranslations } from 'next-intl'

import { usePathname } from '@/i18n/navigation'
import type { Category } from '@/payload-types'

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
  const title = slug ? (categories.find((c) => c.slug === slug)?.name ?? t('title')) : t('title')

  return <h1 className="mb-6 text-3xl font-bold text-text">{title}</h1>
}
