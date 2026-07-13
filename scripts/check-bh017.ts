import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

async function main() {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config.js')
  const payload = await getPayload({ config: await config })

  const product = await payload.find({
    collection: 'products',
    where: { sku: { equals: 'BH-017' } },
    depth: 2,
    limit: 1,
  })

  const img = product.docs[0]?.images?.[0]
  console.log('Product:', product.docs[0]?.sku)
  console.log('Media:', JSON.stringify(img, null, 2))

  const { head } = await import('@vercel/blob')
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    console.log('No blob token')
    return
  }

  const storeId = token.match(/^vercel_blob_rw_([a-z\d]+)_/i)?.[1]?.toLowerCase()
  const baseUrl = `https://${storeId}.private.blob.vercel-storage.com`
  const filename = typeof img === 'object' && img && 'filename' in img ? img.filename : null
  if (filename) {
    const blobUrl = `${baseUrl}/${filename}`
    try {
      const meta = await head(blobUrl, { token })
      console.log('Blob head OK:', blobUrl, meta.contentType, meta.size)
    } catch (e) {
      console.log('Blob head FAIL:', blobUrl, e instanceof Error ? e.message : e)
    }
  }
}

main().catch(console.error)
