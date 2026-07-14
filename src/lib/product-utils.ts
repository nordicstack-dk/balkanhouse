import type { Media, Product } from '@/payload-types'

type ProductWithImages = Product & {
  images?: (number | Media)[] | null
}

function isPublicBlobUrl(url: string | null | undefined): boolean {
  return typeof url === 'string' && url.includes('.public.blob.vercel-storage.com/')
}

function isPrivateBlobUrl(url: string | null | undefined): boolean {
  return typeof url === 'string' && url.includes('.private.blob.vercel-storage.com/')
}

function isProxyMediaUrl(url: string | null | undefined): boolean {
  return typeof url === 'string' && url.startsWith('/api/media/file/')
}

function shouldUseBlobProxy(): boolean {
  return process.env.BLOB_ACCESS === 'private'
}

function getMediaImageUrl(media: Media): string | null {
  const url = media.url

  if (isPublicBlobUrl(url)) {
    return url ?? null
  }

  if (isPrivateBlobUrl(url) || (shouldUseBlobProxy() && media.filename)) {
    if (media.filename) {
      return `/api/media/file/${encodeURIComponent(media.filename)}`
    }
  }

  if (isProxyMediaUrl(url)) {
    return shouldUseBlobProxy() ? (url ?? null) : null
  }

  return url ?? null
}

export function getProductImageUrl(product: ProductWithImages): string | null {
  const first = product.images?.[0]
  if (!first || typeof first === 'number') return null
  return getMediaImageUrl(first)
}

/**
 * Alt text for the product's primary image. Prefers the media document's
 * required alt field, falls back to the product title. Always returns a
 * string so the rendered <img> never drops its alt attribute (which would
 * hurt screen readers and trigger next/image dev warnings).
 */
export function getProductImageAlt(product: ProductWithImages): string {
  const first = product.images?.[0]
  if (first && typeof first !== 'number' && first.alt) return first.alt
  return product.title || ''
}
