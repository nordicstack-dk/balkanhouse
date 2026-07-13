'use client'

import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import type { Category } from '@/payload-types'

type FeaturedCategoriesProps = {
  categories: Category[]
}

export function FeaturedCategories({ categories }: FeaturedCategoriesProps) {
  const t = useTranslations('home')

  if (!categories.length) return null

  const featured = categories.slice(0, 6)

  return (
    <section className="mt-12">
      <h2 className="mb-6 text-2xl font-bold text-text">{t('categoriesTitle')}</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {featured.map((cat) => (
          <Link
            key={cat.id}
            href={`/shop/${cat.slug}`}
            className="group flex flex-col items-center justify-center rounded-xl border border-cream-dark bg-white p-6 text-center shadow-sm transition hover:border-wood-light hover:shadow-md"
          >
            <span className="mb-2 text-3xl" aria-hidden>
              🧺
            </span>
            <span className="font-semibold text-text group-hover:text-burgundy">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link
          href="/shop"
          className="inline-block rounded-lg border-2 border-burgundy px-8 py-3 font-semibold text-burgundy transition hover:bg-burgundy hover:text-cream"
        >
          {t('viewAll')}
        </Link>
      </div>
    </section>
  )
}
