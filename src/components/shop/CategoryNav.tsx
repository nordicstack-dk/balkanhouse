'use client'

import { useTranslations } from 'next-intl'

import { Link, usePathname } from '@/i18n/navigation'
import type { Category } from '@/payload-types'
import { LinkPendingEdge } from '@/components/ui/LinkPending'
import { OFFERS_SLUG } from '@/lib/promotions'

type CategoryNavProps = {
  categories: Category[]
  /** Hidden when nothing is discounted, so the row never leads to an empty page. */
  hasOffers?: boolean
}

/* A gold leading edge plus a paper surface, rather than a solid burgundy block
   that would fight the product grid for attention. */
const rowBase =
  'relative block rounded-core py-2 pl-4 pr-3 text-sm transition-all duration-300 ease-glide'
const rowActive = 'bg-paper font-semibold text-burgundy shadow-soft ring-1 ring-line'
const rowIdle = 'text-text/85 hover:bg-paper/70 hover:text-burgundy'

function ActiveMark() {
  return (
    <span
      className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-gold"
      aria-hidden
    />
  )
}

export function CategoryNav({ categories, hasOffers = false }: CategoryNavProps) {
  const t = useTranslations('shop')
  const pathname = usePathname()
  // '/shop' -> undefined, '/shop/<slug>' -> '<slug>'
  const activeSlug = decodeURIComponent(pathname.split('/')[2] ?? '') || undefined
  const offersActive = activeSlug === OFFERS_SLUG

  return (
    <aside className="shrink-0 md:w-52">
      <ul className="space-y-1">
        <li>
          <Link href="/shop" className={`${rowBase} ${!activeSlug ? rowActive : rowIdle}`}>
            {!activeSlug && <ActiveMark />}
            {t('allCategories')}
            <LinkPendingEdge />
          </Link>
        </li>

        {hasOffers && (
          /* Offers are a filter across the catalogue, not a product type, so the
             row sits above the categories behind a rule. The gold dot ties it to
             the promo tags on the cards. */
          <li className="border-b border-line/70 pb-3">
            <Link
              href={`/shop/${OFFERS_SLUG}`}
              className={`${rowBase} ${offersActive ? rowActive : rowIdle}`}
            >
              {offersActive && <ActiveMark />}
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                {t('offers')}
              </span>
              <LinkPendingEdge />
            </Link>
          </li>
        )}

        {categories.map((cat) => {
          const isActive = activeSlug === cat.slug
          return (
            <li key={cat.id}>
              <Link
                href={`/shop/${cat.slug}`}
                className={`${rowBase} ${isActive ? rowActive : rowIdle}`}
              >
                {isActive && <ActiveMark />}
                {cat.name}
                <LinkPendingEdge />
              </Link>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
