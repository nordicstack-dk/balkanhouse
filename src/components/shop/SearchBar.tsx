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
      <input
        key={q}
        type="search"
        name="q"
        defaultValue={q}
        placeholder={t('searchPlaceholder')}
        className="flex-1 rounded-lg border border-cream-dark bg-white px-4 py-2 text-sm text-text outline-none focus:border-burgundy focus:ring-1 focus:ring-burgundy"
      />
      <button
        type="submit"
        className="rounded-lg bg-burgundy px-4 py-2 text-sm font-medium text-cream shadow-sm transition-all hover:bg-burgundy-dark hover:shadow-md active:scale-[0.98]"
      >
        {t('search')}
      </button>
    </form>
  )
}
