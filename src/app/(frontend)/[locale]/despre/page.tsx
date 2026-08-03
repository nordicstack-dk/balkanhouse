import { getTranslations, setRequestLocale } from 'next-intl/server'

import { RichTextContent } from '@/components/ui/RichTextContent'
import type { Locale } from '@/i18n/routing'
import { getAboutContent } from '@/lib/storefront'
import { isLexicalEmpty } from '@/lib/richtext'

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
  const hasBody = !isLexicalEmpty(content.content)

  return (
    <article className="max-w-3xl">
      <h1 className="text-3xl font-bold text-text">{title}</h1>
      {hasBody ? (
        <RichTextContent data={content.content} className="mt-6" />
      ) : (
        <p className="mt-6 text-lg leading-relaxed text-text-muted">{t('content')}</p>
      )}
    </article>
  )
}
