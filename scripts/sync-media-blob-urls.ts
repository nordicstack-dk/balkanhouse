import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { list } from '@vercel/blob'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

async function getPayloadInstance() {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config.js')
  return getPayload({ config: await config })
}

function proxyMediaUrl(filename: string): string {
  return `/api/media/file/${encodeURIComponent(filename)}`
}

function isPrivateBlobUrl(url: string | null | undefined): boolean {
  return typeof url === 'string' && url.includes('.private.blob.vercel-storage.com/')
}

function isPublicBlobUrl(url: string | null | undefined): boolean {
  return typeof url === 'string' && url.includes('.public.blob.vercel-storage.com/')
}

function blobPathnameFromUrl(url: string): string | null {
  try {
    const pathname = new URL(url).pathname
    return pathname.startsWith('/') ? decodeURIComponent(pathname.slice(1)) : decodeURIComponent(pathname)
  } catch {
    return null
  }
}

async function clearMediaFromProducts(
  payload: Awaited<ReturnType<typeof getPayloadInstance>>,
  mediaId: number,
): Promise<number> {
  const products = await payload.find({
    collection: 'products',
    limit: 100,
    where: {
      images: {
        contains: mediaId,
      },
    },
  })

  for (const product of products.docs) {
    const images = Array.isArray(product.images)
      ? product.images.filter((image) => {
          if (typeof image === 'number') return image !== mediaId
          return image?.id !== mediaId
        })
      : []

    await payload.update({
      collection: 'products',
      id: product.id,
      data: {
        images,
      },
    })
  }

  return products.docs.length
}

async function syncMediaBlobUrls(): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not set in .env')
  }

  const blobAccess = process.env.BLOB_ACCESS ?? 'public'
  const payload = await getPayloadInstance()
  const blobResult = await list({ token, limit: 1000 })
  const blobByFilename = new Map(blobResult.blobs.map((blob) => [blob.pathname, blob.url]))
  const blobPathnames = new Set(blobResult.blobs.map((blob) => blob.pathname))

  const mediaResult = await payload.find({
    collection: 'media',
    limit: 1000,
  })

  let updated = 0
  let alreadySynced = 0
  let repairedPrivate = 0
  let skipped = 0
  let orphansDeleted = 0
  let orphanRefsCleared = 0
  const samples: string[] = []

  for (const doc of mediaResult.docs) {
    const filename = doc.filename
    const url = doc.url

    if (isPublicBlobUrl(url)) {
      const pathname = blobPathnameFromUrl(url!)
      if (pathname && !blobPathnames.has(pathname)) {
        const cleared = await clearMediaFromProducts(payload, doc.id)
        if (cleared > 0) {
          orphanRefsCleared += cleared
          console.log(`  Cleared orphan image from ${cleared} product(s): ${filename ?? pathname}`)
        }

        await payload.delete({
          collection: 'media',
          id: doc.id,
        })
        orphansDeleted++
        console.log(`  Deleted orphan media: ${filename ?? pathname}`)
        continue
      }
    }

    if (!filename) continue

    const blobUrl = blobByFilename.get(filename)
    if (!blobUrl) {
      if (isProxyMediaUrl(url) || isPrivateBlobUrl(url)) {
        const cleared = await clearMediaFromProducts(payload, doc.id)
        if (cleared > 0) {
          orphanRefsCleared += cleared
          console.log(`  Cleared unresolvable image from ${cleared} product(s): ${filename}`)
        }

        await payload.delete({
          collection: 'media',
          id: doc.id,
        })
        orphansDeleted++
        console.log(`  Deleted unresolvable media: ${filename}`)
        continue
      }

      console.log(`  No blob for: ${filename}`)
      skipped++
      continue
    }

    const proxyUrl = proxyMediaUrl(filename)
    const targetUrl = blobAccess === 'private' ? proxyUrl : blobUrl

    try {
      if (blobAccess === 'private' && (isPrivateBlobUrl(doc.url) || doc.url !== proxyUrl)) {
        await payload.update({
          collection: 'media',
          id: doc.id,
          data: {
            url: proxyUrl,
          },
        })

        updated++
        repairedPrivate++
        if (samples.length < 3) {
          samples.push(`${filename}: ${doc.url ?? 'null'} -> ${proxyUrl}`)
        }
        console.log(`  Repaired private URL: ${filename}`)
        continue
      }

      if (doc.url === targetUrl) {
        alreadySynced++
        continue
      }

      await payload.update({
        collection: 'media',
        id: doc.id,
        data: {
          url: targetUrl,
        },
      })

      updated++
      if (samples.length < 3) {
        samples.push(`${filename}: ${doc.url ?? 'null'} -> ${targetUrl}`)
      }
      console.log(`  Updated URL: ${filename}`)
    } catch (error: unknown) {
      const status =
        error && typeof error === 'object' && 'status' in error ? Number(error.status) : null
      if (status === 404) {
        console.log(`  Skipped missing media record: ${filename} (id ${doc.id})`)
        skipped++
        continue
      }
      throw error
    }
  }

  console.log('')
  console.log('=== Sync summary ===')
  console.log(`Blob access mode: ${blobAccess}`)
  console.log(`Blob files: ${blobResult.blobs.length}`)
  console.log(`Media updated: ${updated}`)
  console.log(`Private URLs repaired: ${repairedPrivate}`)
  console.log(`Orphans deleted: ${orphansDeleted}`)
  console.log(`Orphan product refs cleared: ${orphanRefsCleared}`)
  console.log(`Already synced: ${alreadySynced}`)
  console.log(`Skipped: ${skipped}`)
  if (samples.length > 0) {
    console.log('Sample URLs:')
    for (const sample of samples) {
      console.log(`  ${sample}`)
    }
  }
}

function isProxyMediaUrl(url: string | null | undefined): boolean {
  return typeof url === 'string' && url.startsWith('/api/media/file/')
}

syncMediaBlobUrls()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('Failed to sync blob URLs:', error)
    process.exit(1)
  })
