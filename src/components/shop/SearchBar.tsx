'use client'

import { useTranslations } from 'next-intl'

type SearchBarProps = {
  defaultValue?: string
}

export function SearchBar({ defaultValue = '' }: SearchBarProps) {
  const t = useTranslations('shop')

  return (
    <form action="" method="get" className="flex gap-2">
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
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
