'use client'

import { Suspense } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'

import { Link, usePathname } from '@/i18n/navigation'

import { CartButton } from '@/components/cart/CartButton'
import { useLinkPending } from '@/components/ui/LinkPending'

export function Header() {
  const t = useTranslations('nav')

  const links = [
    { href: '/shop' as const, label: t('shop') },
    { href: '/despre' as const, label: t('about') },
    { href: '/faq' as const, label: t('faq') },
    { href: '/contact' as const, label: t('contact') },
  ]

  return (
    <header className="on-dark sticky top-0 z-[var(--bh-z-header)] bg-gradient-to-b from-burgundy to-burgundy-dark text-cream shadow-lift inset-shadow-rim">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5">
        <Link
          href="/"
          className="group flex items-center gap-2.5 text-xl font-bold tracking-[-0.01em] transition-opacity duration-300 hover:opacity-95"
          style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 16 16"
            className="text-gold transition-transform duration-700 ease-spring group-hover:rotate-90"
            aria-hidden
          >
            <path d="M8 0 L16 8 L8 16 L0 8 Z" fill="currentColor" />
            <path d="M8 4 L12 8 L8 12 L4 8 Z" fill="var(--bh-burgundy)" />
          </svg>
          Balkan House
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <NavLink key={link.href} href={link.href} label={link.label} />
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Suspense fallback={null}>
            <LanguageSwitcher />
          </Suspense>
          <CartButton />
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-cream/10 px-4 py-2 md:hidden">
        {links.map((link) => (
          <NavLink key={link.href} href={link.href} label={link.label} compact />
        ))}
      </nav>
      <div className="h-px bg-gold/45" aria-hidden />
    </header>
  )
}

/* The label is never recoloured to gold — too low-contrast on burgundy at this
   size — so the rule underneath carries hover and current-page state. */
function NavLink({
  href,
  label,
  compact = false,
}: {
  href: '/shop' | '/despre' | '/faq' | '/contact'
  label: string
  compact?: boolean
}) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={`group relative shrink-0 rounded-md font-medium transition-colors duration-300 ${
        compact ? 'px-3 py-1.5 text-sm' : 'px-3 py-2 text-sm'
      } ${isActive ? 'text-cream' : 'text-cream/85 hover:text-cream'}`}
    >
      {label}
      <NavLinkRule isActive={isActive} />
    </Link>
  )
}

/* Swept while this link's navigation is in flight. */
function NavLinkRule({ isActive }: { isActive: boolean }) {
  const pending = useLinkPending()

  if (pending) {
    return <span className="bh-link-sweep" aria-hidden />
  }

  return (
    <span
      className={`pointer-events-none absolute inset-x-3 bottom-1 h-px origin-center bg-gold transition-transform duration-500 ease-glide ${
        isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
      }`}
      aria-hidden
    />
  )
}

function LanguageSwitcher() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeLocale = useLocale()
  const query = Object.fromEntries(searchParams.entries())
  const locales = [
    { code: 'ro', label: 'RO' },
    { code: 'da', label: 'DA' },
    { code: 'en', label: 'EN' },
  ] as const

  return (
    <div className="flex gap-0.5 rounded-full bg-burgundy-deep/45 p-0.5 text-xs inset-shadow-rim">
      {locales.map((loc) => (
        <Link
          key={loc.code}
          href={{ pathname, query }}
          locale={loc.code}
          aria-current={loc.code === activeLocale ? 'true' : undefined}
          className={`rounded-full px-2.5 py-1 font-semibold tracking-wide transition-all duration-300 ease-glide ${
            loc.code === activeLocale
              ? 'bg-cream text-burgundy shadow-soft'
              : 'text-cream/80 hover:bg-burgundy-deep/70 hover:text-cream'
          }`}
        >
          {loc.label}
        </Link>
      ))}
    </div>
  )
}
