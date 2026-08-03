import path from 'path'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

import { importProductsFromBuffer } from '@/lib/import-products'
import { getPayloadClient } from '@/lib/payload'

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
const ALLOWED_EXTENSIONS = new Set(['.xlsx', '.xls', '.csv'])

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
      { replaceImages },
    )

    return NextResponse.json(summary)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Import failed'
    console.error('[import-products]', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
