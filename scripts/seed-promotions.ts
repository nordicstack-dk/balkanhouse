import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

interface PromotionSeed {
  name: string
  percentOff: number
  startDate: string
  endDate: string
  productSkus: string[]
}

const PROMOTION_SEEDS: PromotionSeed[] = [
  {
    name: 'Vară conserve -15%',
    percentOff: 15,
    startDate: '2026-06-01',
    endDate: '2026-08-31',
    productSkus: ['BH-001', 'BH-003', 'BH-009', 'BH-011', 'BH-016', 'BH-019'],
  },
  {
    name: 'Mezeluri de weekend -20%',
    percentOff: 20,
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    productSkus: ['BH-002', 'BH-008', 'BH-015'],
  },
  {
    name: 'Dulciuri românești -25%',
    percentOff: 25,
    startDate: '2026-07-01',
    endDate: '2026-09-30',
    productSkus: ['BH-004', 'BH-006', 'BH-012', 'BH-018'],
  },
  {
    name: 'Brânzeturi & lactate -10%',
    percentOff: 10,
    startDate: '2026-07-15',
    endDate: '2026-08-15',
    productSkus: ['BH-009', 'BH-013'],
  },
  {
    name: 'Băuturi tradiționale -12%',
    percentOff: 12,
    startDate: '2026-06-15',
    endDate: '2026-10-15',
    productSkus: ['BH-007', 'BH-013', 'BH-017'],
  },
]

async function getPayloadInstance() {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config.js')
  return getPayload({ config: await config })
}

async function resolveProductIds(
  payload: Awaited<ReturnType<typeof getPayloadInstance>>,
  skus: string[],
): Promise<number[]> {
  const ids: number[] = []

  for (const sku of skus) {
    const result = await payload.find({
      collection: 'products',
      where: {
        sku: {
          equals: sku,
        },
      },
      limit: 1,
    })

    const id = result.docs[0]?.id
    if (typeof id === 'number') {
      ids.push(id)
    } else {
      console.warn(`  Warning: product ${sku} not found — skipping from promotion`)
    }
  }

  return ids
}

async function seedPromotions(): Promise<void> {
  if (!process.env.PAYLOAD_SECRET) {
    throw new Error('PAYLOAD_SECRET is not set in .env')
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in .env')
  }

  const payload = await getPayloadInstance()
  const created: string[] = []
  const updated: string[] = []
  const skipped: string[] = []

  for (const seed of PROMOTION_SEEDS) {
    const productIds = await resolveProductIds(payload, seed.productSkus)

    if (productIds.length === 0) {
      skipped.push(seed.name)
      console.log(`  Skipped (no products): ${seed.name}`)
      continue
    }

    const existing = await payload.find({
      collection: 'promotions',
      where: {
        name: {
          equals: seed.name,
        },
      },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      await payload.update({
        collection: 'promotions',
        id: existing.docs[0].id,
        data: {
          percentOff: seed.percentOff,
          startDate: seed.startDate,
          endDate: seed.endDate,
          products: productIds,
        },
      })

      updated.push(seed.name)
      console.log(
        `  Updated: ${seed.name} (${seed.percentOff}% off, ${productIds.length} products)`,
      )
      continue
    }

    await payload.create({
      collection: 'promotions',
      data: {
        name: seed.name,
        percentOff: seed.percentOff,
        startDate: seed.startDate,
        endDate: seed.endDate,
        products: productIds,
      },
    })

    created.push(seed.name)
    console.log(
      `  Created: ${seed.name} (${seed.percentOff}% off, ${productIds.length} products)`,
    )
  }

  console.log('')
  console.log('=== Summary ===')
  console.log(`Promotions created (${created.length}): ${created.join(', ') || 'none'}`)
  if (updated.length > 0) {
    console.log(`Promotions updated (${updated.length}): ${updated.join(', ')}`)
  }
  if (skipped.length > 0) {
    console.log(`Promotions skipped (${skipped.length}): ${skipped.join(', ')}`)
  }
}

seedPromotions()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('Failed to seed promotions:', error)
    process.exit(1)
  })
