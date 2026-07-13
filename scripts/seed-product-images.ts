import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const SEED_IMAGES_DIR = path.resolve(__dirname, '../public/seed-images')

const PRODUCT_IMAGE_SEEDS = [
  { sku: 'BH-001', alt: 'Romanian eggplant zacusca in a glass jar' },
  { sku: 'BH-002', alt: 'Sibiu salami sliced on a wooden board' },
  { sku: 'BH-003', alt: 'Instant borsh concentrate package' },
  { sku: 'BH-004', alt: 'Romanian plum jam in a glass jar' },
  { sku: 'BH-005', alt: 'Instant mămăligă cornmeal package' },
  { sku: 'BH-006', alt: 'Rom hazelnut chocolate bar' },
  { sku: 'BH-007', alt: 'Traditional Romanian plum brandy bottle 0.5L' },
  { sku: 'BH-008', alt: 'Smoked lamb pastrami thinly sliced' },
  { sku: 'BH-009', alt: 'Burduf cheese in fir bark casing' },
  { sku: 'BH-010', alt: 'Boromir sliced white bread loaf in packaging' },
  { sku: 'BH-011', alt: 'Canned Romanian meatball soup' },
  { sku: 'BH-012', alt: 'Vanilla halva block with sesame' },
  { sku: 'BH-013', alt: 'Borsec buttermilk carton' },
  { sku: 'BH-014', alt: 'Crunchy sesame pretzels covrigi' },
  { sku: 'BH-015', alt: 'Smoked pork tenderloin thinly sliced' },
  { sku: 'BH-016', alt: 'Traditional mashed beans can' },
  { sku: 'BH-017', alt: 'Pelină carbonated mineral water bottle' },
  { sku: 'BH-018', alt: 'Hazelnut nougat candy bar' },
  { sku: 'BH-019', alt: 'Romanian garlic sauce in a jar' },
  { sku: 'BH-020', alt: 'Walnut cozonac sweet bread loaf' },
] as const

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'] as const

function resolveImagePath(sku: string): string | null {
  for (const ext of IMAGE_EXTENSIONS) {
    const filePath = path.join(SEED_IMAGES_DIR, `${sku}${ext}`)
    if (fs.existsSync(filePath)) {
      return filePath
    }
  }

  return null
}

async function getPayloadInstance() {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config.js')
  return getPayload({ config: await config })
}

async function findMediaByAlt(
  payload: Awaited<ReturnType<typeof getPayloadInstance>>,
  alt: string,
): Promise<number | null> {
  const result = await payload.find({
    collection: 'media',
    where: {
      alt: {
        equals: alt,
      },
    },
    limit: 1,
  })

  const id = result.docs[0]?.id
  return typeof id === 'number' ? id : null
}

async function seedProductImages(force = false): Promise<void> {
  if (!process.env.PAYLOAD_SECRET) {
    throw new Error('PAYLOAD_SECRET is not set in .env')
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in .env')
  }

  if (!fs.existsSync(SEED_IMAGES_DIR)) {
    throw new Error(
      `Seed images directory not found: ${SEED_IMAGES_DIR}\nGenerate images first and save them as BH-001.png, BH-002.png, etc.`,
    )
  }

  const payload = await getPayloadInstance()
  const attached: string[] = []
  const skipped: string[] = []
  const missing: string[] = []
  const notFound: string[] = []

  for (const seed of PRODUCT_IMAGE_SEEDS) {
    const imagePath = resolveImagePath(seed.sku)

    if (!imagePath) {
      missing.push(seed.sku)
      console.log(`  Missing image file: ${seed.sku}`)
      continue
    }

    const productResult = await payload.find({
      collection: 'products',
      where: {
        sku: {
          equals: seed.sku,
        },
      },
      limit: 1,
    })

    const product = productResult.docs[0]
    if (!product) {
      notFound.push(seed.sku)
      console.log(`  Product not found: ${seed.sku}`)
      continue
    }

    const existingImages = product.images
    if (!force && Array.isArray(existingImages) && existingImages.length > 0) {
      skipped.push(seed.sku)
      console.log(`  Skipped (has images): ${seed.sku}`)
      continue
    }

    let mediaId = await findMediaByAlt(payload, seed.alt)

    if (!mediaId) {
      const media = await payload.create({
        collection: 'media',
        data: {
          alt: seed.alt,
        },
        filePath: imagePath,
      })

      mediaId = media.id
      console.log(`  Uploaded media: ${seed.sku}`)
    }

    await payload.update({
      collection: 'products',
      id: product.id,
      data: {
        images: [mediaId],
      },
    })

    attached.push(seed.sku)
    console.log(`  Attached image: ${seed.sku}`)
  }

  console.log('')
  console.log('=== Summary ===')
  console.log(`Images attached (${attached.length}): ${attached.join(', ') || 'none'}`)
  if (skipped.length > 0) {
    console.log(`Skipped (${skipped.length}): ${skipped.join(', ')}`)
  }
  if (missing.length > 0) {
    console.log(`Missing image files (${missing.length}): ${missing.join(', ')}`)
  }
  if (notFound.length > 0) {
    console.log(`Products not found (${notFound.length}): ${notFound.join(', ')}`)
  }
}

const force = process.argv.includes('--force')

seedProductImages(force)
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('Failed to seed product images:', error)
    process.exit(1)
  })
