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
      <h1 className="mb-5 text-4xl font-bold text-text md:text-5xl">{title}</h1>
      {hasIntro ? (
        <RichTextContent data={content.intro} className="mb-10" />
      ) : (
        <p className="mb-10 max-w-xl text-lg leading-relaxed text-text-muted">{t('intro')}</p>
      )}
      <div className="rounded-shell grid gap-8 bg-paper p-8 shadow-soft ring-1 ring-line/60 sm:grid-cols-2">
        <div>
          <p className="bh-label text-text-muted">{t('email')}</p>
          <a
            href={`mailto:${email}`}
            className="mt-2 block text-lg font-medium text-burgundy underline decoration-gold decoration-1 underline-offset-4 transition-colors duration-300 hover:decoration-burgundy"
          >
            {email}
          </a>
        </div>
        <div>
          <p className="bh-label text-text-muted">{t('phone')}</p>
          <a
            href={`tel:${phone.replace(/\s/g, '')}`}
            className="bh-nums mt-2 block text-lg font-medium text-burgundy underline decoration-gold decoration-1 underline-offset-4 transition-colors duration-300 hover:decoration-burgundy"
          >
            {phone}
          </a>
        </div>
      </div>
      {hasBody && <RichTextContent data={content.body} className="mt-8" />}
    </div>
  )
}
