import { hasLocale } from 'next-intl'
import { notFound } from 'next/navigation'

import { routing, type Locale } from '@/i18n/routing'

/**
 * Reject unknown locales BEFORE any locale-scoped work runs, returning a clean
 * 404. Paths like `/favicon.png` (and other bogus single-segment requests from
 * bots/static-file probes) slip past the i18n middleware and match the `[locale]`
 * route with locale="favicon.png". Pages render concurrently with the layout, so
 * the layout's own guard doesn't stop a page's data fetch — without this, the
 * bogus value reaches Payload and Postgres throws `invalid input value for enum
 * _locales` (a 500) instead of a 404 (prod logs 2026-07-20).
 *
 * Call at the very top of every `[locale]` page/layout that queries the DB,
 * before setRequestLocale and any fetch.
 */
export function assertLocale(locale: string): Locale {
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }
  return locale
}
