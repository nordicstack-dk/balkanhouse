import { getTranslations, setRequestLocale } from 'next-intl/server'

import type { Locale } from '@/i18n/routing'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  const t = await getTranslations('about')

  return (
    <article className="prose prose-lg max-w-3xl">
      <h1 className="text-3xl font-bold text-text">{t('title')}</h1>
      <p className="mt-6 text-lg leading-relaxed text-text-muted">{t('content')}</p>
    </article>
  )
}
