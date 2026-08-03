import { getTranslations, setRequestLocale } from 'next-intl/server'

import type { Locale } from '@/i18n/routing'
import { getContactContent } from '@/lib/storefront'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  const [content, t] = await Promise.all([
    getContactContent(locale as Locale),
    getTranslations('contact'),
  ])

  const title = content.title?.trim() || t('title')
  const intro = content.intro?.trim() || t('intro')
  const email = content.email?.trim() || t('emailValue')
  const phone = content.phone?.trim() || t('phoneValue')

  return (
    <div className="max-w-3xl">
      <h1 className="mb-4 text-3xl font-bold text-text">{title}</h1>
      <p className="mb-8 text-lg text-text-muted">{intro}</p>
      <div className="space-y-6 rounded-xl border border-cream-dark bg-white p-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            {t('email')}
          </p>
          <a
            href={`mailto:${email}`}
            className="mt-1 block text-xl text-burgundy hover:underline"
          >
            {email}
          </a>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            {t('phone')}
          </p>
          <a
            href={`tel:${phone.replace(/\s/g, '')}`}
            className="mt-1 block text-xl text-burgundy hover:underline"
          >
            {phone}
          </a>
        </div>
      </div>
    </div>
  )
}
