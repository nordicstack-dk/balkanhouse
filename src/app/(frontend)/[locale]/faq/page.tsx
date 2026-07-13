import { getTranslations, setRequestLocale } from 'next-intl/server'

import type { Locale } from '@/i18n/routing'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function FaqPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  const t = await getTranslations('faq')

  const items = [
    { q: t('q1'), a: t('a1') },
    { q: t('q2'), a: t('a2') },
    { q: t('q3'), a: t('a3') },
  ]

  return (
    <div className="max-w-3xl">
      <h1 className="mb-8 text-3xl font-bold text-text">{t('title')}</h1>
      <dl className="space-y-6">
        {items.map((item, i) => (
          <div key={i} className="rounded-xl border border-cream-dark bg-white p-6">
            <dt className="font-semibold text-text">{item.q}</dt>
            <dd className="mt-2 text-text-muted">{item.a}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
