import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const SEED_IMAGES_DIR = path.resolve(__dirname, '../public/seed-images')
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'] as const

/**
 * Tile geometry. The home page renders these behind a horizontal scrim that
 * covers roughly the left 40%, so the composite is built wide and the
 * interesting part of each product shot sits toward the right.
 */
const TILE_WIDTH = 1600
const TILE_HEIGHT = 640
const PANEL_GAP = 0
const MAX_PANELS = 3
/** Warm ground behind the panels (visible only if a panel fails to cover). */
const GROUND = { r: 242, g: 233, b: 217 }

type PayloadInstance = Awaited<ReturnType<typeof getPayloadInstance>>

async function getPayloadInstance() {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config.js')
  return getPayload({ config: await config })
}

function resolveLocalImage(sku: string): string | null {
  for (const ext of IMAGE_EXTENSIONS) {
    const filePath = path.join(SEED_IMAGES_DIR, `${sku}${ext}`)
    if (fs.existsSync(filePath)) return filePath
  }
  return null
}

/**
 * Source bytes for one product photo. Prefers the local seed file (fast, and
 * works offline); falls back to the uploaded blob for products that were
 * imported rather than seeded.
 */
async function loadProductImage(product: {
  sku?: string | null
  images?: unknown
}): Promise<Buffer | null> {
  if (product.sku) {
    const local = resolveLocalImage(product.sku)
    if (local) return fs.readFileSync(local)
  }

  const first = Array.isArray(product.images) ? product.images[0] : null
  const url =
    first && typeof first === 'object' && 'url' in first ? (first as { url?: string }).url : null
  if (!url || !/^https?:\/\//.test(url)) return null

  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  }
}

/** Panel widths that always sum exactly to TILE_WIDTH, gaps included. */
function panelWidths(count: number): number[] {
  const available = TILE_WIDTH - PANEL_GAP * (count - 1)
  const base = Math.floor(available / count)
  const widths = Array.from({ length: count }, () => base)
  widths[count - 1] += available - base * count
  return widths
}

async function buildTile(sources: Buffer[]): Promise<Buffer> {
  const widths = panelWidths(sources.length)

  const panels = await Promise.all(
    sources.map((buf, i) =>
      sharp(buf)
        .resize(widths[i], TILE_HEIGHT, { fit: 'cover', position: 'centre' })
        .toBuffer(),
    ),
  )

  let left = 0
  const composite = panels.map((input, i) => {
    const entry = { input, left, top: 0 }
    left += widths[i] + PANEL_GAP
    return entry
  })

  return sharp({
    create: { width: TILE_WIDTH, height: TILE_HEIGHT, channels: 3, background: GROUND },
  })
    .composite(composite)
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer()
}

async function seedCategoryImages(force = false): Promise<void> {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set in .env')
  if (!process.env.PAYLOAD_SECRET) throw new Error('PAYLOAD_SECRET is not set in .env')

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    console.log('Vercel Blob storage enabled via BLOB_READ_WRITE_TOKEN')
  } else {
    console.warn('Warning: BLOB_READ_WRITE_TOKEN is not set — tiles will be stored locally.')
  }

  const payload: PayloadInstance = await getPayloadInstance()

  const categories = await payload.find({
    collection: 'categories',
    limit: 100,
    sort: 'name',
    depth: 0,
  })

  const generated: string[] = []
  const skipped: string[] = []
  const noSource: string[] = []

  for (const category of categories.docs) {
    if (category.image && !force) {
      skipped.push(category.name)
      console.log(`  Skipped (has image): ${category.name}`)
      continue
    }

    const products = await payload.find({
      collection: 'products',
      where: { category: { equals: category.id } },
      limit: 12,
      depth: 1,
    })

    const sources: Buffer[] = []
    for (const product of products.docs) {
      if (sources.length >= MAX_PANELS) break
      const buf = await loadProductImage(product)
      if (buf) sources.push(buf)
    }

    if (sources.length === 0) {
      noSource.push(category.name)
      console.log(`  No product imagery available: ${category.name}`)
      continue
    }

    const tile = await buildTile(sources)
    const filename = `category-${category.slug}.jpg`

    // Regenerating must replace, not accumulate: Payload suffixes a colliding
    // filename (`-1`, `-2`, ...), so without this every --force run would leave
    // the previous tile orphaned in blob storage.
    const previousId = typeof category.image === 'number' ? category.image : category.image?.id
    if (previousId) {
      try {
        await payload.delete({ collection: 'media', id: previousId })
        console.log(`  Deleted previous tile media #${previousId}: ${category.name}`)
      } catch (error) {
        console.warn(`  Could not delete previous tile media #${previousId}:`, error)
      }
    }

    const media = await payload.create({
      collection: 'media',
      data: {
        alt: `Selection of products from the ${category.name} category`,
      },
      file: {
        data: tile,
        mimetype: 'image/jpeg',
        name: filename,
        size: tile.length,
      },
      // Filenames here never correspond to a SKU, so skip the media hook that
      // tries to attach new uploads to a matching product.
      context: { skipProductImageAutoLink: true },
    })

    await payload.update({
      collection: 'categories',
      id: category.id,
      data: { image: media.id },
    })

    generated.push(category.name)
    console.log(
      `  Generated ${filename} from ${sources.length} product photo(s) -> ${media.url ?? 'local'}`,
    )
  }

  console.log('')
  console.log('=== Summary ===')
  console.log(`Tiles generated (${generated.length}): ${generated.join(', ') || 'none'}`)
  if (skipped.length) console.log(`Skipped (${skipped.length}): ${skipped.join(', ')}`)
  if (noSource.length) console.log(`No source imagery (${noSource.length}): ${noSource.join(', ')}`)
  console.log('')
  console.log('Re-run with --force to regenerate tiles that already have an image.')
}

const force = process.argv.includes('--force')

seedCategoryImages(force)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[seed-category-images] failed:', err)
    process.exit(1)
  })
