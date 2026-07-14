import { getTranslations, setRequestLocale } from 'next-intl/server'

import { CheckoutForm } from '@/components/checkout/CheckoutForm'
import type { Locale } from '@/i18n/routing'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function CheckoutPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  const t = await getTranslations('checkout')

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-text">{t('title')}</h1>
      <CheckoutForm />
    </div>
  )
}
