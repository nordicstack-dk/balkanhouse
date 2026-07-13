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

async function syncMediaBlobUrls(): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not set in .env')
  }

  const blobAccess = process.env.BLOB_ACCESS ?? 'private'
  const payload = await getPayloadInstance()
  const blobResult = await list({ token, limit: 1000 })
  const blobByFilename = new Map(blobResult.blobs.map((blob) => [blob.pathname, blob.url]))

  const mediaResult = await payload.find({
    collection: 'media',
    limit: 1000,
    where: {
      filename: {
        like: 'BH-%',
      },
    },
  })

  let updated = 0
  let alreadySynced = 0
  let repairedPrivate = 0
  const samples: string[] = []

  for (const doc of mediaResult.docs) {
    const filename = doc.filename
    if (!filename) continue

    const blobUrl = blobByFilename.get(filename)
    if (!blobUrl) {
      console.log(`  No blob for: ${filename}`)
      continue
    }

    const proxyUrl = proxyMediaUrl(filename)
    const targetUrl = blobAccess === 'private' ? proxyUrl : blobUrl

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
      samples.push(`${filename} -> ${targetUrl}`)
    }
    console.log(`  Updated URL: ${filename}`)
  }

  console.log('')
  console.log('=== Sync summary ===')
  console.log(`Blob access mode: ${blobAccess}`)
  console.log(`Blob files: ${blobResult.blobs.length}`)
  console.log(`Media updated: ${updated}`)
  console.log(`Private URLs repaired: ${repairedPrivate}`)
  console.log(`Already synced: ${alreadySynced}`)
  if (samples.length > 0) {
    console.log('Sample URLs:')
    for (const sample of samples) {
      console.log(`  ${sample}`)
    }
  }
}

syncMediaBlobUrls()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('Failed to sync blob URLs:', error)
    process.exit(1)
  })
