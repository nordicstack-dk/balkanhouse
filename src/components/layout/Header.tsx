'use client'

import { useTranslations } from 'next-intl'

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
    <header className="sticky top-0 z-50 border-b border-burgundy-dark/20 bg-burgundy text-cream shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-xl font-bold tracking-tight hover:opacity-90">
          Balkan House
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium transition hover:bg-burgundy-dark/50"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <CartButton />
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-burgundy-dark/20 px-4 py-2 md:hidden">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="shrink-0 rounded-md px-3 py-1.5 text-sm transition hover:bg-burgundy-dark/50"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}

function LanguageSwitcher() {
  const pathname = usePathname()
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
          href={pathname}
          locale={loc.code}
          className="rounded px-2 py-1 font-medium transition hover:bg-burgundy-dark/60"
        >
          {loc.label}
        </Link>
      ))}
    </div>
  )
}
