import { getTranslations, setRequestLocale } from 'next-intl/server'

import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function CheckoutPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  const t = await getTranslations('checkout')

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-cream-dark bg-white p-8 text-center">
      <div className="mb-4 text-5xl" aria-hidden>
        ✓
      </div>
      <h1 className="text-2xl font-bold text-text">{t('stubTitle')}</h1>
      <p className="mt-4 text-text-muted">{t('stubMessage')}</p>
      <Link
        href="/shop"
        className="mt-8 inline-block rounded-lg bg-burgundy px-8 py-3 font-semibold text-cream transition hover:bg-burgundy-dark"
      >
        {t('backToShop')}
      </Link>
    </div>
  )
}
