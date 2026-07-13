import { getTranslations, setRequestLocale } from 'next-intl/server'

import type { Locale } from '@/i18n/routing'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  const t = await getTranslations('contact')

  return (
    <div className="max-w-3xl">
      <h1 className="mb-4 text-3xl font-bold text-text">{t('title')}</h1>
      <p className="mb-8 text-lg text-text-muted">{t('intro')}</p>
      <div className="space-y-6 rounded-xl border border-cream-dark bg-white p-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            {t('email')}
          </p>
          <a
            href={`mailto:${t('emailValue')}`}
            className="mt-1 block text-xl text-burgundy hover:underline"
          >
            {t('emailValue')}
          </a>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            {t('phone')}
          </p>
          <a
            href={`tel:${t('phoneValue').replace(/\s/g, '')}`}
            className="mt-1 block text-xl text-burgundy hover:underline"
          >
            {t('phoneValue')}
          </a>
        </div>
      </div>
    </div>
  )
}
