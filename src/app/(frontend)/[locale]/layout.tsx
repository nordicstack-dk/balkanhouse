import { Suspense } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { notFound } from 'next/navigation'

import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { NavigationProgress } from '@/components/layout/NavigationProgress'
import { CartProvider } from '@/components/cart/CartProvider'
import { routing, type Locale } from '@/i18n/routing'
import { getSiteSettings } from '@/lib/storefront'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: 'meta' })

  return {
    title: t('title'),
    description: t('description'),
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  setRequestLocale(locale)
  const [messages, settings] = await Promise.all([getMessages(), getSiteSettings()])

  return (
    <NextIntlClientProvider messages={messages}>
      <CartProvider>
        <div className="flex min-h-dvh flex-col">
          {/* Suspense because it reads useSearchParams, same as the header's
              language switcher. */}
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
          <Header />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 md:py-16">{children}</main>
          <Footer supportEmail={settings.email} supportPhone={settings.phone} />
        </div>
      </CartProvider>
    </NextIntlClientProvider>
  )
}
