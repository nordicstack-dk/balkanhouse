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

  let blobCount = 0
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

    if (url.includes('blob.vercel-storage.com')) {
      blobCount++
      if (samples.length < 3) samples.push(`${product.sku}: ${url}`)
    } else {
      localCount++
      if (samples.length < 3) samples.push(`${product.sku}: ${url}`)
    }
  }

  console.log('=== Product image URL verification ===')
  console.log(`Products with blob URLs: ${blobCount}`)
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
