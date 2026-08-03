import path from 'path'
import { list, type ListBlobResultBlob } from '@vercel/blob'
import type { Payload } from 'payload'

import type { Media, Product } from '@/payload-types'
import {
  createMediaFromBlob,
  isImageFilename,
  linkMediaToProduct,
  stemFromFilename,
} from '@/lib/product-image-link'

export type SyncOrphanBlobMediaOptions = {
  replaceImages?: boolean
}

export type SyncOrphanBlobMediaResult = {
  blobsScanned: number
  mediaCreated: number
  productsLinked: number
  skipped: number
  errors: string[]
}

async function listAllBlobs(token: string): Promise<ListBlobResultBlob[]> {
  const blobs: ListBlobResultBlob[] = []
  let cursor: string | undefined

  do {
    const page = await list({ token, limit: 1000, cursor })
    blobs.push(...page.blobs)
    cursor = page.hasMore ? page.cursor : undefined
  } while (cursor)

  return blobs
}

async function loadMediaByFilename(payload: Payload): Promise<Map<string, Media>> {
  const byFilename = new Map<string, Media>()
  let page = 1
  let hasNext = true

  while (hasNext) {
    const result = await payload.find({
      collection: 'media',
      limit: 100,
      page,
      depth: 0,
    })

    for (const doc of result.docs) {
      if (doc.filename) {
        byFilename.set(doc.filename, doc)
      }
    }

    hasNext = result.hasNextPage
    page += 1
  }

  return byFilename
}

async function loadProductsBySku(payload: Payload): Promise<Map<string, Product>> {
  const bySku = new Map<string, Product>()
  let page = 1
  let hasNext = true

  while (hasNext) {
    const result = await payload.find({
      collection: 'products',
      limit: 100,
      page,
      depth: 0,
    })

    for (const doc of result.docs) {
      if (doc.sku) {
        bySku.set(doc.sku, doc)
      }
    }

    hasNext = result.hasNextPage
    page += 1
  }

  return bySku
}

/**
 * Register image blobs that have no Payload Media row, then attach each
 * matching media file to the product whose SKU equals the filename stem.
 * Kept as a manual/repair action; create/update + import auto-link by SKU.
 */
export async function syncOrphanBlobMedia(
  payload: Payload,
  options: SyncOrphanBlobMediaOptions = {},
): Promise<SyncOrphanBlobMediaResult> {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not set')
  }

  const replaceImages = Boolean(options.replaceImages)
  const result: SyncOrphanBlobMediaResult = {
    blobsScanned: 0,
    mediaCreated: 0,
    productsLinked: 0,
    skipped: 0,
    errors: [],
  }

  const blobs = await listAllBlobs(token)
  const imageBlobs = blobs.filter((blob) => isImageFilename(path.basename(blob.pathname)))
  result.blobsScanned = imageBlobs.length

  const mediaByFilename = await loadMediaByFilename(payload)
  const productsBySku = await loadProductsBySku(payload)

  for (const blob of imageBlobs) {
    const filename = path.basename(blob.pathname)
    const stem = stemFromFilename(filename)

    try {
      let media = mediaByFilename.get(filename) ?? mediaByFilename.get(blob.pathname)

      if (!media) {
        media = await createMediaFromBlob(payload, blob, token, { alt: stem })
        mediaByFilename.set(filename, media)
        result.mediaCreated += 1
      }

      const product = productsBySku.get(stem)
      if (!product) {
        result.skipped += 1
        continue
      }

      const linked = await linkMediaToProduct(payload, product, media.id, { replaceImages })
      if (linked) {
        result.productsLinked += 1
        productsBySku.set(stem, {
          ...product,
          images: [media.id],
        })
      } else {
        result.skipped += 1
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      result.errors.push(`${filename}: ${message}`)
    }
  }

  return result
}
