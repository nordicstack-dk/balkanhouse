import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

async function main() {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config.js')
  const payload = await getPayload({ config: await config })

  const products = await payload.find({
    collection: 'products',
    limit: 25,
    depth: 1,
    sort: 'sku',
  })

  let proxyCount = 0
  let publicBlobCount = 0
  let privateBlobCount = 0
  let localCount = 0
  let missingCount = 0
  const samples: string[] = []

  for (const product of products.docs) {
    const images = product.images
    if (!Array.isArray(images) || images.length === 0) {
      missingCount++
      continue
    }

    const image = images[0]
    const url = typeof image === 'object' && image !== null && 'url' in image ? String(image.url) : null

    if (!url) {
      missingCount++
      continue
    }

    if (url.startsWith('/api/media/file/')) {
      proxyCount++
    } else if (url.includes('.private.blob.vercel-storage.com')) {
      privateBlobCount++
    } else if (url.includes('.public.blob.vercel-storage.com')) {
      publicBlobCount++
    } else {
      localCount++
    }

    if (samples.length < 3) samples.push(`${product.sku}: ${url}`)
  }

  console.log('=== Product image URL verification ===')
  console.log(`Products with Payload proxy URLs: ${proxyCount}`)
  console.log(`Products with public blob URLs: ${publicBlobCount}`)
  console.log(`Products with private blob URLs (broken): ${privateBlobCount}`)
  console.log(`Products with local/other URLs: ${localCount}`)
  console.log(`Products without images: ${missingCount}`)
  console.log('Sample URLs:')
  for (const sample of samples) {
    console.log(`  ${sample}`)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
