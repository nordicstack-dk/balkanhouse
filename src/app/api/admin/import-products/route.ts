import path from 'path'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

import { importProductsFromBuffer } from '@/lib/import-products'
import { getPayloadClient } from '@/lib/payload'

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
const ALLOWED_EXTENSIONS = new Set(['.xlsx', '.xls', '.csv'])

/** Rows written per request when the caller doesn't say. */
const DEFAULT_CHUNK = 80
const MAX_CHUNK = 200

/**
 * Writing a whole catalogue in one request does not fit in a serverless
 * function: at ~0.25s per row a 600-row file needs minutes, and the platform
 * returns 504 partway through, leaving a half-applied import. The client posts
 * the same file repeatedly with a moving offset instead; this ceiling is only a
 * safety net for a slow chunk.
 */
export const maxDuration = 300

export async function POST(request: Request) {
  try {
    const payload = await getPayloadClient()
    const { user } = await payload.auth({ headers: await headers() })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const replaceImages = String(formData.get('replaceImages') ?? '') === 'true'
    const dryRun = String(formData.get('dryRun') ?? '') === 'true'

    const parsePositive = (value: FormDataEntryValue | null, fallback: number, max: number) => {
      const n = Number(value)
      if (!Number.isFinite(n) || n < 0) return fallback
      return Math.min(Math.floor(n), max)
    }
    const offset = parsePositive(formData.get('offset'), 0, Number.MAX_SAFE_INTEGER)
    const limit = parsePositive(formData.get('limit'), DEFAULT_CHUNK, MAX_CHUNK) || DEFAULT_CHUNK

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file upload' }, { status: 400 })
    }

    const filename = file.name || 'upload.xlsx'
    const ext = path.extname(filename).toLowerCase()
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Upload .xlsx or .csv' },
        { status: 400 },
      )
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 },
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const summary = await importProductsFromBuffer(
      payload,
      { buffer, filename },
      { replaceImages, dryRun, offset, limit },
    )

    return NextResponse.json(summary)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Import failed'
    console.error('[import-products]', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
