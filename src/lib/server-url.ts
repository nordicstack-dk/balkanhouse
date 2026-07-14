const LOCAL_DEV_URL = 'http://localhost:3000'
const LOCALHOST_PATTERN = /^https?:\/\/localhost(:\d+)?\/?$/i

function isProduction(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL === '1' ||
    Boolean(process.env.VERCEL_ENV)
  )
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim().replace(/\/$/, '')
  if (!trimmed) {
    return trimmed
  }

  const withProtocol = trimmed.includes('://')
    ? trimmed
    : `${isProduction() ? 'https' : 'http'}://${trimmed}`

  if (isProduction() && withProtocol.startsWith('http://')) {
    return withProtocol.replace(/^http:\/\//, 'https://')
  }

  return withProtocol
}

function resolveConfiguredUrl(): string | undefined {
  const explicit = process.env.NEXT_PUBLIC_SERVER_URL?.trim()
  if (!explicit) {
    return undefined
  }

  if (isProduction() && LOCALHOST_PATTERN.test(explicit)) {
    return undefined
  }

  return normalizeUrl(explicit)
}

/** Public base URL for links (emails, payment return URLs, etc.). */
export function getServerUrl(): string {
  const configured = resolveConfiguredUrl()
  if (configured) {
    return configured
  }

  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (productionUrl) {
    return normalizeUrl(productionUrl)
  }

  const vercelUrl = process.env.VERCEL_URL?.trim()
  if (vercelUrl) {
    return normalizeUrl(`https://${vercelUrl}`)
  }

  return LOCAL_DEV_URL
}
