import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'

import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

// Root-level static paths (e.g. /favicon.ico) skip i18n middleware but would
// otherwise match the [locale] segment and trigger Payload queries.
const ROOT_STATIC_FILE = /^\/[^/]+\.[a-zA-Z0-9]+$/

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (ROOT_STATIC_FILE.test(pathname)) {
    return new NextResponse(null, { status: 404 })
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: [
    '/',
    '/(ro|da|en)/:path*',
    '/((?!api|admin|_next|_vercel|.*\\..*).*)',
    // Static root files are excluded by the pattern above but still hit [locale]
    '/favicon.ico',
    '/:file(robots\\.txt|sitemap\\.xml)',
  ],
}
