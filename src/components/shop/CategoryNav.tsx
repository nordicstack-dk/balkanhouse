'use client'

import { useTranslations } from 'next-intl'

import { Link, usePathname } from '@/i18n/navigation'
import type { Category } from '@/payload-types'

type CategoryNavProps = {
  categories: Category[]
}

export function CategoryNav({ categories }: CategoryNavProps) {
  const t = useTranslations('shop')
  const pathname = usePathname()
  // '/shop' -> undefined, '/shop/<slug>' -> '<slug>'
  const activeSlug = decodeURIComponent(pathname.split('/')[2] ?? '') || undefined

  return (
    <aside className="shrink-0 md:w-48">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
        {t('title')}
      </h2>
      <ul className="space-y-1">
        <li>
          <Link
            href="/shop"
            className={`block rounded-md px-3 py-2 text-sm transition-colors ${
              !activeSlug
                ? 'bg-burgundy font-medium text-cream shadow-sm'
                : 'text-text hover:bg-cream-dark active:bg-cream-dark/70'
            }`}
          >
            {t('allCategories')}
          </Link>
        </li>
        {categories.map((cat) => (
          <li key={cat.id}>
            <Link
              href={`/shop/${cat.slug}`}
              className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                activeSlug === cat.slug
                  ? 'bg-burgundy font-medium text-cream shadow-sm'
                  : 'text-text hover:bg-cream-dark active:bg-cream-dark/70'
              }`}
            >
              {cat.name}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  )
}
