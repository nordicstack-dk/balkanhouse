'use client'

import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'
import { LinkPendingSpinner } from '@/components/ui/LinkPendingSpinner'

export function Hero() {
  const t = useTranslations('home')

  return (
    <section className="on-dark relative overflow-hidden rounded-2xl bg-gradient-to-br from-burgundy to-burgundy-dark px-6 py-16 text-cream md:px-12 md:py-24">
      <div className="bh-pattern-lattice pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden />
      <div className="relative z-10 max-w-xl">
        <h1 className="text-3xl font-bold leading-tight md:text-5xl">{t('heroTitle')}</h1>
        <p className="mt-4 text-lg text-cream/90 md:text-xl">{t('heroSubtitle')}</p>
        <Link
          href="/shop"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-gold px-8 py-3 font-semibold text-burgundy-dark shadow-md transition hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-lg active:translate-y-0 active:scale-[0.98]"
        >
          {t('shopNow')}
          <span aria-hidden>→</span>
          <LinkPendingSpinner />
        </Link>
      </div>
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full bg-wood/20 md:h-72 md:w-72"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-12 right-12 h-32 w-32 rounded-full bg-gold/10 md:h-48 md:w-48"
        aria-hidden
      />
      <div className="bh-motif-gold absolute inset-x-0 bottom-3 opacity-70" aria-hidden />
    </section>
  )
}
