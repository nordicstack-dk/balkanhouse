'use client'

import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { LinkPending } from '@/components/ui/LinkPending'
import { Spinner } from '@/components/ui/Spinner'

export function Hero() {
  const t = useTranslations('home')

  return (
    // Wood tray around the panel; inner radius is the outer minus the padding.
    <section className="bh-rise rounded-shell bg-gradient-to-b from-wood-light/45 to-wood/25 p-1.5 shadow-deep">
      <div className="on-dark rounded-core relative overflow-hidden bg-gradient-to-br from-burgundy via-burgundy-dark to-burgundy-deep px-6 py-14 text-cream inset-shadow-rim md:px-14 md:py-20">
        <div className="bh-pattern-cloth pointer-events-none absolute inset-0 opacity-[0.07]" aria-hidden />

        <div className="relative max-w-xl">
          <h1 className="text-[2.5rem] font-bold leading-[1.04] tracking-[-0.02em] md:text-[3.5rem]">
            {t('heroTitle')}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-cream/85">{t('heroSubtitle')}</p>

          <Link
            href="/shop"
            className="group mt-9 inline-flex items-center gap-3 rounded-full bg-gold py-2.5 pl-8 pr-2.5 text-[1.0625rem] font-bold text-burgundy-deep shadow-lift transition-all duration-500 ease-glide hover:bg-gold-light hover:shadow-deep active:scale-[0.98]"
          >
            {t('shopNow')}
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full bg-burgundy-deep/25 transition-transform duration-500 ease-spring group-hover:translate-x-0.5 group-hover:scale-105"
              aria-hidden
            >
              <LinkPending
                idle={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                }
                pending={<Spinner className="h-4 w-4" />}
              />
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}
