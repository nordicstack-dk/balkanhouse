'use client'

import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

type FooterProps = {
  supportEmail?: string | null
  supportPhone?: string | null
}

export function Footer({ supportEmail, supportPhone }: FooterProps) {
  const t = useTranslations('footer')
  const tNav = useTranslations('nav')
  const tContact = useTranslations('contact')

  const email = supportEmail?.trim() || tContact('emailValue')
  const phone = supportPhone?.trim() || tContact('phoneValue')

  const navLinks = [
    { href: '/shop' as const, label: tNav('shop') },
    { href: '/despre' as const, label: tNav('about') },
    { href: '/faq' as const, label: tNav('faq') },
    { href: '/contact' as const, label: tNav('contact') },
  ]

  return (
    /* `mt-auto` keeps the footer pinned to the bottom on short pages — the
       breathing room above it comes from the main element's padding. */
    <footer className="on-dark mt-auto bg-gradient-to-b from-forest to-forest-deep text-cream">
      <div className="bh-motif-gold opacity-70" aria-hidden />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-3 md:gap-8">
        <div>
          <p
            className="text-xl font-bold tracking-[-0.01em]"
            style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}
          >
            Balkan House
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-cream/75">{t('tagline')}</p>
        </div>
        <div>
          <p className="bh-label mb-4 text-gold/85">{t('links')}</p>
          <ul className="space-y-2.5 text-sm">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-cream/85 underline decoration-transparent decoration-1 underline-offset-4 transition-all duration-300 ease-glide hover:text-gold hover:decoration-gold"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="bh-label mb-4 text-gold/85">{t('support')}</p>
          <ul className="space-y-2.5 text-sm">
            <li>
              <span className="text-cream/60">{tContact('email')}: </span>
              <a
                href={`mailto:${email}`}
                className="text-cream/85 underline decoration-transparent decoration-1 underline-offset-4 transition-all duration-300 ease-glide hover:text-gold hover:decoration-gold"
              >
                {email}
              </a>
            </li>
            <li>
              <span className="text-cream/60">{tContact('phone')}: </span>
              <a
                href={`tel:${phone.replace(/\s/g, '')}`}
                className="bh-nums text-cream/85 underline decoration-transparent decoration-1 underline-offset-4 transition-all duration-300 ease-glide hover:text-gold hover:decoration-gold"
              >
                {phone}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cream/10 py-5 text-center text-xs tracking-wide text-cream/55">
        © {new Date().getFullYear()} Balkan House
      </div>
    </footer>
  )
}
