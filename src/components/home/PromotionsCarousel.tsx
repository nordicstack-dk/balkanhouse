'use client'

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'

const AUTO_ADVANCE_MS = 4500

type PromotionsCarouselProps = {
  /**
   * Server-rendered product cards. Passing them as children keeps the card
   * markup out of the client bundle and the product data out of the RSC
   * payload — this component only handles scrolling behavior.
   */
  children: ReactNode
}

export function PromotionsCarousel({ children }: PromotionsCarouselProps) {
  const t = useTranslations('home')
  const trackRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(false)
  const [hasOverflow, setHasOverflow] = useState(false)
  const itemCount = Children.count(children)

  const scrollByPage = useCallback((direction: 1 | -1) => {
    const track = trackRef.current
    if (!track) return
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 10
    if (direction === 1 && atEnd) {
      track.scrollTo({ left: 0, behavior: 'smooth' })
    } else if (direction === -1 && track.scrollLeft <= 10) {
      track.scrollTo({ left: track.scrollWidth, behavior: 'smooth' })
    } else {
      track.scrollBy({ left: direction * track.clientWidth, behavior: 'smooth' })
    }
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const updateOverflow = () => setHasOverflow(track.scrollWidth > track.clientWidth + 1)
    updateOverflow()
    const observer = new ResizeObserver(updateOverflow)
    observer.observe(track)
    return () => observer.disconnect()
  }, [itemCount])

  useEffect(() => {
    if (!hasOverflow) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const interval = setInterval(() => {
      if (pausedRef.current || document.hidden) return
      scrollByPage(1)
    }, AUTO_ADVANCE_MS)
    return () => clearInterval(interval)
  }, [hasOverflow, scrollByPage])

  if (!itemCount) return null

  return (
    <section className="mt-12" aria-roledescription="carousel" aria-label={t('promotionsTitle')}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-text">{t('promotionsTitle')}</h2>
        {hasOverflow && (
          <div className="flex gap-2">
            <CarouselArrow direction={-1} label={t('carouselPrev')} onClick={scrollByPage} />
            <CarouselArrow direction={1} label={t('carouselNext')} onClick={scrollByPage} />
          </div>
        )}
      </div>
      <div
        ref={trackRef}
        onPointerEnter={() => (pausedRef.current = true)}
        onPointerLeave={() => (pausedRef.current = false)}
        onTouchStart={() => (pausedRef.current = true)}
        onFocus={() => (pausedRef.current = true)}
        onBlur={() => (pausedRef.current = false)}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {Children.map(children, (child) => (
          <div className="w-56 shrink-0 snap-start md:w-64">{child}</div>
        ))}
      </div>
    </section>
  )
}

function CarouselArrow({
  direction,
  label,
  onClick,
}: {
  direction: 1 | -1
  label: string
  onClick: (direction: 1 | -1) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(direction)}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-cream-dark bg-white text-burgundy shadow-sm transition-all hover:border-burgundy hover:bg-burgundy hover:text-cream hover:shadow-md active:scale-95"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        style={direction === -1 ? { transform: 'scaleX(-1)' } : undefined}
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  )
}
