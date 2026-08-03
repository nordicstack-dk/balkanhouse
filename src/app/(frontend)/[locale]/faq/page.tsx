import { getTranslations, setRequestLocale } from 'next-intl/server'

import { FaqAccordion, type FaqItem } from '@/components/faq/FaqAccordion'
import type { Locale } from '@/i18n/routing'
import { getFaqContent } from '@/lib/storefront'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function FaqPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  const [content, t] = await Promise.all([
    getFaqContent(locale as Locale),
    getTranslations('faq'),
  ])

  const title = content.title?.trim() || t('title')

  // Prefer questions managed in Payload; fall back to the bundled defaults so
  // the page is never empty before an admin fills the FAQ global in.
  const cmsItems: FaqItem[] = (content.items ?? [])
    .map((item) => ({ question: item.question ?? '', answer: item.answer ?? '' }))
    .filter((item) => item.question && item.answer)

  const items: FaqItem[] = cmsItems.length
    ? cmsItems
    : [
        { question: t('q1'), answer: t('a1') },
        { question: t('q2'), answer: t('a2') },
        { question: t('q3'), answer: t('a3') },
      ]

  return (
    <div className="max-w-3xl">
      <h1 className="mb-8 text-3xl font-bold text-text">{title}</h1>
      <FaqAccordion items={items} />
    </div>
  )
}
