'use client'

import { Suspense } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'

import { Link, usePathname } from '@/i18n/navigation'

import { CartButton } from '@/components/cart/CartButton'

export function Header() {
  const t = useTranslations('nav')

  const links = [
    { href: '/shop' as const, label: t('shop') },
    { href: '/despre' as const, label: t('about') },
    { href: '/faq' as const, label: t('faq') },
    { href: '/contact' as const, label: t('contact') },
  ]

  return (
    <header className="on-dark sticky top-0 z-50 bg-burgundy text-cream shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold tracking-tight transition hover:opacity-90"
          style={{ fontFamily: 'var(--font-playfair, Georgia, serif)' }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            className="text-gold"
            aria-hidden
          >
            <path d="M8 0 L16 8 L8 16 L0 8 Z" fill="currentColor" />
            <path d="M8 4 L12 8 L8 12 L4 8 Z" fill="var(--bh-burgundy)" />
          </svg>
          Balkan House
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-burgundy-dark/50 active:bg-burgundy-dark/70"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Suspense fallback={null}>
            <LanguageSwitcher />
          </Suspense>
          <CartButton />
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-burgundy-dark/20 px-4 py-2 md:hidden">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-burgundy-dark/50 active:bg-burgundy-dark/70"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="bh-motif-gold" aria-hidden />
    </header>
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
    <div className="flex gap-0.5 rounded-md bg-burgundy-dark/40 p-0.5 text-xs">
      {locales.map((loc) => (
        <Link
          key={loc.code}
          href={{ pathname, query }}
          locale={loc.code}
          aria-current={loc.code === activeLocale ? 'true' : undefined}
          className={`rounded px-2 py-1 font-medium transition-colors ${
            loc.code === activeLocale
              ? 'bg-cream text-burgundy'
              : 'hover:bg-burgundy-dark/60 active:bg-burgundy-dark'
          }`}
        >
          {loc.label}
        </Link>
      ))}
    </div>
  )
}
