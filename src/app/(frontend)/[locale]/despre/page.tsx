import { getTranslations, setRequestLocale } from 'next-intl/server'

import type { Locale } from '@/i18n/routing'
import { getAboutContent } from '@/lib/storefront'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  const [content, t] = await Promise.all([
    getAboutContent(locale as Locale),
    getTranslations('about'),
  ])

  const title = content.title?.trim() || t('title')
  const body = content.content?.trim() || t('content')
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

  return (
    <article className="prose prose-lg max-w-3xl">
      <h1 className="text-3xl font-bold text-text">{title}</h1>
      {paragraphs.map((paragraph, i) => (
        <p key={i} className="mt-6 whitespace-pre-line text-lg leading-relaxed text-text-muted">
          {paragraph}
        </p>
      ))}
    </article>
  )
}
