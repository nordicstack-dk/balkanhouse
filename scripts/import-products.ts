import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { importProductsFromBuffer } from '../src/lib/import-products.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

async function getPayloadInstance() {
  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config.js')
  return getPayload({ config: await config })
}

async function main(): Promise<void> {
  if (!process.env.PAYLOAD_SECRET) {
    throw new Error('PAYLOAD_SECRET is not set in .env')
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in .env')
  }

  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const replaceImages = args.includes('--replace-images')
  const imagesDirArg = args.find((arg) => arg.startsWith('--images-dir='))
  const imagesDir = imagesDirArg
    ? path.resolve(imagesDirArg.slice('--images-dir='.length))
    : undefined
  const fileArg = args.find((arg) => !arg.startsWith('--'))

  if (!fileArg) {
    console.error(
      'Usage: pnpm import:products -- <file.xlsx|file.csv> [--dry-run] [--images-dir=<folder>] [--replace-images]',
    )
    process.exit(1)
  }

  const filePath = path.resolve(fileArg)
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }

  const buffer = fs.readFileSync(filePath)
  const filename = path.basename(filePath)

  console.log(`Importing ${filename}${dryRun ? ' (dry run)' : ''}…`)
  if (imagesDir) {
    console.log(`Images directory: ${imagesDir}`)
  } else {
    console.log('Images: linking by SKU from Media / Vercel Blob (no --images-dir)')
  }

  const payload = await getPayloadInstance()
  const result = await importProductsFromBuffer(
    payload,
    { buffer, filename },
    { dryRun, imagesDir, replaceImages },
  )

  console.log(`Parsed ${result.rowCount} product row(s)`)

  if (result.dryRun && result.preview) {
    for (const row of result.preview) {
      console.log(
        `  ${row.sku} | ${row.title} | ${row.priceDkk} DKK | ${row.stockStatus} | image: ${row.imageNote}`,
      )
    }
    return
  }

  console.log(`Done. Created: ${result.created}, updated: ${result.updated}`)
  console.log(`Images attached: ${result.imagesAttached}`)
  if (result.imagesMissing.length > 0) {
    console.log(
      `No image found (local / Media / Blob) for ${result.imagesMissing.length} product(s): ${result.imagesMissing.join(', ')}`,
    )
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('Import failed:', error)
    process.exit(1)
  })
