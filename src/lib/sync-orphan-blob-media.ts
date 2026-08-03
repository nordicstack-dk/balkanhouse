import path from 'path'
import { del, get, list, type ListBlobResultBlob } from '@vercel/blob'
import type { Payload } from 'payload'

import type { Media, Product } from '@/payload-types'

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp'])

const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
}

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

function proxyMediaUrl(filename: string): string {
  return `/api/media/file/${encodeURIComponent(filename)}`
}

function blobAccess(): 'public' | 'private' {
  return process.env.BLOB_ACCESS === 'private' ? 'private' : 'public'
}

function targetMediaUrl(filename: string, blobUrl: string): string {
  return blobAccess() === 'private' ? proxyMediaUrl(filename) : blobUrl
}

function blobPathnameFromUrl(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const pathname = new URL(url).pathname
    return pathname.startsWith('/') ? decodeURIComponent(pathname.slice(1)) : decodeURIComponent(pathname)
  } catch {
    return null
  }
}

function isImageFilename(filename: string): boolean {
  return IMAGE_EXTENSIONS.has(path.extname(filename).toLowerCase())
}

function stemFromFilename(filename: string): string {
  return path.parse(filename).name
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

async function loadMediaByFilename(
  payload: Payload,
): Promise<Map<string, Media>> {
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

async function readableStreamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  return Buffer.from(await new Response(stream).arrayBuffer())
}

async function fetchBlobBuffer(
  blob: ListBlobResultBlob,
  token: string,
): Promise<{ data: Buffer; mimetype: string }> {
  const access = blobAccess()
  const result = await get(blob.pathname, { access, token })

  if (!result || result.statusCode !== 200 || !result.stream) {
    throw new Error(`Could not download blob: ${blob.pathname}`)
  }

  const data = await readableStreamToBuffer(result.stream)
  const ext = path.extname(blob.pathname).toLowerCase()
  const mimetype =
    result.blob.contentType?.split(';')[0]?.trim() ||
    MIME_BY_EXT[ext] ||
    'application/octet-stream'

  return { data, mimetype }
}

async function createMediaFromBlob(
  payload: Payload,
  blob: ListBlobResultBlob,
  token: string,
  alt: string,
): Promise<Media> {
  const filename = path.basename(blob.pathname)
  const { data, mimetype } = await fetchBlobBuffer(blob, token)

  const created = await payload.create({
    collection: 'media',
    data: { alt },
    file: {
      data,
      mimetype,
      name: filename,
      size: data.length,
    },
    overrideAccess: true,
  })

  const createdPathname =
    blobPathnameFromUrl(created.url) ?? created.filename ?? null
  const targetUrl = targetMediaUrl(filename, blob.url)

  // Re-upload may have created a new pathname (random suffix). Point media at
  // the original orphan blob and delete the duplicate upload.
  if (createdPathname && createdPathname !== blob.pathname) {
    try {
      await del(createdPathname, { token })
    } catch {
      // Best-effort cleanup; original orphan remains the source of truth.
    }

    return payload.update({
      collection: 'media',
      id: created.id,
      data: {
        filename,
        url: targetUrl,
      },
      overrideAccess: true,
    })
  }

  if (created.url !== targetUrl || created.filename !== filename) {
    return payload.update({
      collection: 'media',
      id: created.id,
      data: {
        filename,
        url: targetUrl,
      },
      overrideAccess: true,
    })
  }

  return created
}

function productHasImages(product: Product): boolean {
  return Array.isArray(product.images) && product.images.length > 0
}

async function linkMediaToProduct(
  payload: Payload,
  product: Product,
  mediaId: number,
  replaceImages: boolean,
): Promise<boolean> {
  if (productHasImages(product) && !replaceImages) {
    return false
  }

  const alreadyLinked = Array.isArray(product.images)
    ? product.images.some((image) => {
        if (typeof image === 'number') return image === mediaId
        return image?.id === mediaId
      })
    : false

  if (alreadyLinked && !replaceImages) {
    return false
  }

  await payload.update({
    collection: 'products',
    id: product.id,
    data: {
      images: [mediaId],
    },
    overrideAccess: true,
  })

  return true
}

/**
 * Register image blobs that have no Payload Media row, then attach each
 * matching media file to the product whose SKU equals the filename stem.
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
        media = await createMediaFromBlob(payload, blob, token, stem)
        mediaByFilename.set(filename, media)
        result.mediaCreated += 1
      }

      const product = productsBySku.get(stem)
      if (!product) {
        result.skipped += 1
        continue
      }

      const linked = await linkMediaToProduct(payload, product, media.id, replaceImages)
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
