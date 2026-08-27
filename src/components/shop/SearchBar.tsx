'use client'

import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'

import { useRouter } from '@/i18n/navigation'

export function SearchBar() {
  const t = useTranslations('shop')
  const locale = useLocale()
  const router = useRouter()
  const q = useSearchParams().get('q') ?? ''

  // Search always spans the whole catalog, so it lands on /shop even when the
  // customer is browsing a single category.
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = new FormData(event.currentTarget).get('q')
    const query = typeof value === 'string' ? value.trim() : ''
    router.push(query ? { pathname: '/shop', query: { q: query } } : { pathname: '/shop' })
  }

  return (
    // `action` is the no-JS fallback; onSubmit handles client-side navigation.
    <form
      action={`/${locale}/shop`}
      method="get"
      onSubmit={handleSubmit}
      className="flex gap-2"
    >
      <div className="relative flex-1">
        <span
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/60"
          aria-hidden
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M16.5 16.5 L21 21" />
          </svg>
        </span>
        <input
          key={q}
          type="search"
          name="q"
          defaultValue={q}
          placeholder={t('searchPlaceholder')}
          className="w-full rounded-full bg-paper py-2.5 pl-11 pr-4 text-sm text-text shadow-soft ring-1 ring-line outline-none transition-shadow duration-300 ease-glide placeholder:text-text-muted/60 focus:ring-2 focus:ring-burgundy"
        />
      </div>
      <button
        type="submit"
        className="shrink-0 rounded-full bg-burgundy px-6 py-2.5 text-sm font-semibold text-cream shadow-soft transition-all duration-500 ease-glide hover:bg-burgundy-dark hover:shadow-lift active:scale-[0.98]"
      >
        {t('search')}
      </button>
    </form>
  )
}
