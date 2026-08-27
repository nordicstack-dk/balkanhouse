'use client'

import Image from 'next/image'
import type { CSSProperties } from 'react'
import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { getCategoryImageUrl } from '@/lib/product-utils'
import type { Category } from '@/payload-types'
import { LinkPending, LinkPendingEdge } from '@/components/ui/LinkPending'
import { Spinner } from '@/components/ui/Spinner'

type FeaturedCategoriesProps = {
  categories: Category[]
}

/*
 * The hero's burgundy and the footer's forest, as a checkerboard so no tile
 * touches another of the same tone. Kept as rgb triplets because each is used
 * both as a flat gradient (no image) and as a scrim (over one).
 */
const GROUNDS = [
  { light: '122 34 49', dark: '67 16 29' },
  { light: '53 96 79', dark: '27 47 39' },
]

export function FeaturedCategories({ categories }: FeaturedCategoriesProps) {
  const t = useTranslations('home')

  if (!categories.length) return null

  const featured = categories.slice(0, 6)

  return (
    <section className="mt-20 md:mt-28">
      <h2 className="mb-8 max-w-lg text-3xl font-bold text-text md:text-4xl">
        {t('categoriesTitle')}
      </h2>

      {/* An odd count promotes the last tile to a full-width band, so any
          number of categories tiles without leaving a hole. */}
      <div className="grid gap-3 sm:grid-cols-2 md:gap-4">
        {featured.map((cat, i) => {
          const isLastOdd = featured.length % 2 === 1 && i === featured.length - 1
          const ground = GROUNDS[(i + Math.floor(i / 2)) % GROUNDS.length]
          const imageUrl = getCategoryImageUrl(cat)

          return (
            <Link
              key={cat.id}
              href={`/shop/${cat.slug}`}
              style={{ '--bh-i': i } as CSSProperties}
              className={`bh-rise on-dark rounded-core group relative flex min-h-40 flex-col justify-center overflow-hidden p-6 shadow-lift inset-shadow-rim transition-all duration-500 ease-glide hover:-translate-y-1 hover:shadow-deep active:translate-y-0 md:min-h-44 md:p-8 ${
                isLastOdd ? 'sm:col-span-2' : ''
              }`}
            >
              {imageUrl ? (
                <>
                  {/* Decorative: the name is rendered as text over it. */}
                  <Image
                    src={imageUrl}
                    alt=""
                    fill
                    aria-hidden
                    sizes={
                      isLastOdd
                        ? '(max-width: 640px) 100vw, 1120px'
                        : '(max-width: 640px) 100vw, 560px'
                    }
                    className="object-cover transition-transform duration-700 ease-glide group-hover:scale-[1.04]"
                  />
                  {/* Solid ground under the label, clearing to nothing on the
                      right. Product shots are bright; darkening the whole tile
                      would grey them out. */}
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      backgroundImage: `linear-gradient(100deg, rgb(${ground.dark}) 0%, rgb(${ground.dark} / 0.96) 30%, rgb(${ground.light} / 0.66) 55%, rgb(${ground.light} / 0) 88%)`,
                    }}
                    aria-hidden
                  />
                  {/* Stops the bright photo butting against the tile edge. */}
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      backgroundImage: `linear-gradient(270deg, rgb(${ground.dark} / 0.34) 0%, rgb(${ground.dark} / 0) 22%)`,
                    }}
                    aria-hidden
                  />
                </>
              ) : (
                <>
                  {/* No tile image set in the admin yet. */}
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      backgroundImage: `linear-gradient(155deg, rgb(${ground.light}) 0%, rgb(${ground.dark}) 100%)`,
                    }}
                    aria-hidden
                  />
                  <div
                    className="bh-pattern-cloth pointer-events-none absolute inset-0 opacity-[0.13] transition-opacity duration-700 ease-glide group-hover:opacity-25"
                    style={{ filter: 'sepia(1) saturate(3) hue-rotate(3deg) brightness(1.15)' }}
                    aria-hidden
                  />
                </>
              )}

              <div className="relative max-w-[62%]">
                <span
                  className="block text-2xl font-semibold leading-tight tracking-[-0.01em] text-cream transition-transform duration-500 ease-glide group-hover:translate-x-1 md:text-[1.75rem]"
                  style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}
                >
                  {cat.name}
                </span>
                <span
                  className="mt-3 block h-0.5 w-8 origin-left bg-gold transition-transform duration-500 ease-glide group-hover:scale-x-[2.25]"
                  aria-hidden
                />
              </div>
              <LinkPendingEdge />
            </Link>
          )
        })}
      </div>

      <div className="mt-8">
        <Link
          href="/shop"
          className="group inline-flex items-center gap-2 font-semibold text-burgundy underline decoration-gold decoration-1 underline-offset-[6px] transition-colors duration-300 hover:decoration-burgundy"
        >
          {t('viewAll')}
          <LinkPending
            idle={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="transition-transform duration-300 ease-glide group-hover:translate-x-1">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            }
            pending={<Spinner className="h-4 w-4" />}
          />
        </Link>
      </div>
    </section>
  )
}
