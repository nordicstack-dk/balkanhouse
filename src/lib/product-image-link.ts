import path from 'path'
import { del, get, head, list, type ListBlobResultBlob } from '@vercel/blob'
import type { Payload, PayloadRequest, RequestContext } from 'payload'

import type { Media, Product } from '@/payload-types'

export const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'] as const

const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
}

export function isImageFilename(filename: string): boolean {
  return IMAGE_EXTENSIONS.includes(
    path.extname(filename).toLowerCase() as (typeof IMAGE_EXTENSIONS)[number],
  )
}

export function stemFromFilename(filename: string): string {
  return path.parse(filename).name
}

export function candidateFilenamesForSku(skuOrBase: string): string[] {
  const base = skuOrBase.trim()
  if (!base) return []

  const existingExt = IMAGE_EXTENSIONS.find((ext) => base.toLowerCase().endsWith(ext))
  if (existingExt) {
    return [path.basename(base)]
  }

  return IMAGE_EXTENSIONS.map((ext) => `${base}${ext}`)
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

export function productHasImages(product: Pick<Product, 'images'> | null | undefined): boolean {
  return Array.isArray(product?.images) && product.images.length > 0
}

export function imagesFieldHasValues(images: unknown): boolean {
  return Array.isArray(images) && images.length > 0
}

async function readableStreamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  return Buffer.from(await new Response(stream).arrayBuffer())
}

async function fetchBlobBuffer(
  blob: Pick<ListBlobResultBlob, 'pathname'>,
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

export type CreateMediaFromBlobOptions = {
  alt: string
  context?: RequestContext
  req?: Partial<PayloadRequest>
}

/**
 * Create a Media doc from an existing Vercel Blob object. If Payload re-uploads
 * under a different pathname, point the media row back at the original blob and
 * delete the duplicate.
 */
export async function createMediaFromBlob(
  payload: Payload,
  blob: Pick<ListBlobResultBlob, 'pathname' | 'url'>,
  token: string,
  options: CreateMediaFromBlobOptions,
): Promise<Media> {
  const filename = path.basename(blob.pathname)
  const { data, mimetype } = await fetchBlobBuffer(blob, token)

  const created = await payload.create({
    collection: 'media',
    data: { alt: options.alt },
    file: {
      data,
      mimetype,
      name: filename,
      size: data.length,
    },
    overrideAccess: true,
    context: {
      ...options.context,
      skipProductImageAutoLink: true,
    },
    req: options.req,
  })

  const createdPathname = blobPathnameFromUrl(created.url) ?? created.filename ?? null
  const targetUrl = targetMediaUrl(filename, blob.url)

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
      context: { skipProductImageAutoLink: true },
      req: options.req,
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
      context: { skipProductImageAutoLink: true },
      req: options.req,
    })
  }

  return created
}

export async function findMediaByFilename(
  payload: Payload,
  filename: string,
): Promise<Media | null> {
  const result = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
    depth: 0,
  })

  return result.docs[0] ?? null
}

/**
 * Find existing Media for a SKU/base name (e.g. BH-001 → BH-001.png), or create
 * Media from a matching orphan Vercel Blob if present.
 */
export async function resolveMediaIdForSku(
  payload: Payload,
  skuOrBase: string,
  options: { alt?: string; req?: Partial<PayloadRequest> } = {},
): Promise<number | null> {
  const candidates = candidateFilenamesForSku(skuOrBase)
  if (candidates.length === 0) return null

  for (const filename of candidates) {
    const existing = await findMediaByFilename(payload, filename)
    if (existing) return existing.id
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) return null

  const alt = options.alt?.trim() || stemFromFilename(candidates[0])

  for (const filename of candidates) {
    try {
      const meta = await head(filename, { token })
      if (!isImageFilename(meta.pathname)) continue

      const media = await createMediaFromBlob(
        payload,
        { pathname: meta.pathname, url: meta.url },
        token,
        { alt, req: options.req },
      )
      return media.id
    } catch {
      // No blob for this candidate filename.
    }
  }

  return null
}

export type LinkMediaToProductOptions = {
  replaceImages?: boolean
  req?: Partial<PayloadRequest>
}

/**
 * Attach media to a product when images are empty (or replaceImages is set).
 * Returns true when the product was updated.
 */
export async function linkMediaToProduct(
  payload: Payload,
  product: Pick<Product, 'id' | 'images'>,
  mediaId: number,
  options: LinkMediaToProductOptions = {},
): Promise<boolean> {
  const replaceImages = Boolean(options.replaceImages)

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
    context: { skipSkuImageAutoLink: true },
    req: options.req,
  })

  return true
}

/**
 * After a media upload: if the filename stem matches a product SKU and that
 * product has no images, attach this media.
 */
export async function autoLinkMediaToMatchingProduct(
  payload: Payload,
  media: Pick<Media, 'id' | 'filename'>,
  options: { req?: Partial<PayloadRequest>; replaceImages?: boolean } = {},
): Promise<boolean> {
  if (!media.filename || !isImageFilename(media.filename)) return false

  const sku = stemFromFilename(media.filename)
  const result = await payload.find({
    collection: 'products',
    where: { sku: { equals: sku } },
    limit: 1,
    depth: 0,
  })

  const product = result.docs[0]
  if (!product) return false

  return linkMediaToProduct(payload, product, media.id, options)
}

/**
 * When saving a product with empty images, resolve Media/Blob by SKU and
 * return the images field value to set (or null if nothing found).
 */
export async function resolveImagesForProductSku(
  payload: Payload,
  sku: string | null | undefined,
  options: { alt?: string; req?: Partial<PayloadRequest> } = {},
): Promise<number[] | null> {
  if (!sku?.trim()) return null

  const mediaId = await resolveMediaIdForSku(payload, sku.trim(), options)
  return mediaId == null ? null : [mediaId]
}

/**
 * Bulk equivalent of resolveMediaIdForSku, for the product importer.
 *
 * Per SKU that has no picture — the common case — the single-row version costs
 * four Media queries plus four Vercel Blob `head()` calls, one per candidate
 * extension. Across a 600-row sheet that is ~4,900 round trips and dominated
 * the import (~1.1-1.5s/row, against ~0.25s for the writes themselves).
 *
 * This loads every Media filename and every blob pathname once, then answers
 * from memory. A miss costs nothing; a hit still does the real work of creating
 * the Media record.
 */
export async function createSkuImageResolver(
  payload: Payload,
  options: { req?: Partial<PayloadRequest> } = {},
): Promise<(skuOrBase: string, opts?: { alt?: string }) => Promise<number | null>> {
  const mediaByFilename = new Map<string, number>()
  let page = 1
  for (;;) {
    const result = await payload.find({ collection: 'media', limit: 500, page, depth: 0 })
    for (const doc of result.docs) {
      if (doc.filename) mediaByFilename.set(doc.filename, doc.id as number)
    }
    if (!result.hasNextPage) break
    page += 1
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN
  const blobByFilename = new Map<string, { pathname: string; url: string }>()
  if (token) {
    let cursor: string | undefined
    do {
      const listed = await list({ token, limit: 1000, cursor })
      for (const blob of listed.blobs) {
        blobByFilename.set(path.basename(blob.pathname), {
          pathname: blob.pathname,
          url: blob.url,
        })
      }
      cursor = listed.hasMore ? listed.cursor : undefined
    } while (cursor)
  }

  return async (skuOrBase, opts = {}) => {
    const candidates = candidateFilenamesForSku(skuOrBase)
    if (candidates.length === 0) return null

    for (const filename of candidates) {
      const id = mediaByFilename.get(filename)
      if (id != null) return id
    }

    if (!token) return null
    const alt = opts.alt?.trim() || stemFromFilename(candidates[0])

    for (const filename of candidates) {
      const blob = blobByFilename.get(filename)
      if (!blob || !isImageFilename(blob.pathname)) continue
      const media = await createMediaFromBlob(payload, blob, token, { alt, req: options.req })
      // Later rows sharing this filename reuse the record we just made.
      mediaByFilename.set(filename, media.id as number)
      return media.id as number
    }

    return null
  }
}
