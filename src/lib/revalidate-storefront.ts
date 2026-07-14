import { revalidateTag } from 'next/cache'

export type StorefrontCacheTag = 'products' | 'categories' | 'promotions'

/**
 * Invalidate storefront caches after a CMS change so edits appear immediately
 * instead of waiting for the cache TTL. Safe to call from Payload collection
 * hooks: when Payload runs outside a Next.js request scope (seed/import
 * scripts), revalidateTag throws and we fall back to TTL expiry.
 */
export function revalidateStorefrontTags(...tags: StorefrontCacheTag[]) {
  for (const tag of tags) {
    try {
      revalidateTag(tag)
    } catch {
      // Outside Next.js request scope — TTL expiry will pick up the change.
    }
  }
}
