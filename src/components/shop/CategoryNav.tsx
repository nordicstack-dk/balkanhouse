'use client'

import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import type { Category } from '@/payload-types'

type CategoryNavProps = {
  categories: Category[]
  activeSlug?: string
}

export function CategoryNav({ categories, activeSlug }: CategoryNavProps) {
  const t = useTranslations('shop')

  return (
    <aside className="shrink-0 md:w-48">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
        {t('title')}
      </h2>
      <ul className="space-y-1">
        <li>
          <Link
            href="/shop"
            className={`block rounded-md px-3 py-2 text-sm transition ${
              !activeSlug
                ? 'bg-burgundy text-cream'
                : 'text-text hover:bg-cream-dark'
            }`}
          >
            {t('allCategories')}
          </Link>
        </li>
        {categories.map((cat) => (
          <li key={cat.id}>
            <Link
              href={`/shop/${cat.slug}`}
              className={`block rounded-md px-3 py-2 text-sm transition ${
                activeSlug === cat.slug
                  ? 'bg-burgundy text-cream'
                  : 'text-text hover:bg-cream-dark'
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
