import { getTranslations, setRequestLocale } from 'next-intl/server'

import { RichTextContent } from '@/components/ui/RichTextContent'
import type { Locale } from '@/i18n/routing'
import { getContactContent, getSiteSettings } from '@/lib/storefront'
import { isLexicalEmpty } from '@/lib/richtext'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  const [content, settings, t] = await Promise.all([
    getContactContent(locale as Locale),
    getSiteSettings(),
    getTranslations('contact'),
  ])

  const title = content.title?.trim() || t('title')
  const email = settings.email?.trim() || t('emailValue')
  const phone = settings.phone?.trim() || t('phoneValue')
  const hasIntro = !isLexicalEmpty(content.intro)
  const hasBody = !isLexicalEmpty(content.body)

  return (
    <div className="max-w-3xl">
      <h1 className="mb-4 text-3xl font-bold text-text">{title}</h1>
      {hasIntro ? (
        <RichTextContent data={content.intro} className="mb-8" />
      ) : (
        <p className="mb-8 text-lg text-text-muted">{t('intro')}</p>
      )}
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
      {hasBody && <RichTextContent data={content.body} className="mt-8" />}
    </div>
  )
}
