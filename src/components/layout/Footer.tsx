'use client'

import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

export function Footer() {
  const t = useTranslations('footer')
  const tNav = useTranslations('nav')
  const tContact = useTranslations('contact')

  return (
    <footer className="on-dark mt-auto bg-forest text-cream">
      <div className="bh-motif-gold opacity-80" aria-hidden />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <p
            className="text-lg font-bold"
            style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}
          >
            Balkan House
          </p>
          <p className="mt-2 text-sm text-cream/80">{t('tagline')}</p>
        </div>
        <div>
          <p className="mb-3 font-semibold">{t('links')}</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/shop" className="transition-colors hover:text-gold hover:underline">
                {tNav('shop')}
              </Link>
            </li>
            <li>
              <Link href="/despre" className="transition-colors hover:text-gold hover:underline">
                {tNav('about')}
              </Link>
            </li>
            <li>
              <Link href="/faq" className="transition-colors hover:text-gold hover:underline">
                {tNav('faq')}
              </Link>
            </li>
            <li>
              <Link href="/contact" className="transition-colors hover:text-gold hover:underline">
                {tNav('contact')}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 font-semibold">{t('support')}</p>
          <ul className="space-y-2 text-sm">
            <li>
              <span className="text-cream/70">{tContact('email')}: </span>
              <a href={`mailto:${tContact('emailValue')}`} className="transition-colors hover:text-gold hover:underline">
                {tContact('emailValue')}
              </a>
            </li>
            <li>
              <span className="text-cream/70">{tContact('phone')}: </span>
              <a href={`tel:${tContact('phoneValue').replace(/\s/g, '')}`} className="transition-colors hover:text-gold hover:underline">
                {tContact('phoneValue')}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cream/10 py-4 text-center text-xs text-cream/60">
        © {new Date().getFullYear()} Balkan House
      </div>
    </footer>
  )
}
