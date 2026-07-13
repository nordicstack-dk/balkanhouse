import type { Media, Product } from '@/payload-types'

type ProductWithImages = Product & {
  images?: (number | Media)[] | null
}

function getMediaImageUrl(media: Media): string | null {
  const url = media.url

  if (url?.startsWith('/api/media/file/')) {
    return url
  }

  if (url?.includes('.public.blob.vercel-storage.com/')) {
    return url
  }

  if (url?.includes('.private.blob.vercel-storage.com/') || media.filename) {
    if (media.filename) {
      return `/api/media/file/${encodeURIComponent(media.filename)}`
    }
  }

  return url ?? null
}

export function getProductImageUrl(product: ProductWithImages): string | null {
  const first = product.images?.[0]
  if (!first || typeof first === 'number') return null
  return getMediaImageUrl(first)
}
