import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

import { buildProductExportWorkbook } from '@/lib/export-products'
import { getPayloadClient } from '@/lib/payload'

/** Building the sheet reads the whole catalogue, so give it room. */
export const maxDuration = 120

export async function GET() {
  try {
    const payload = await getPayloadClient()
    const { user } = await payload.auth({ headers: await headers() })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const buffer = await buildProductExportWorkbook(payload)
    const stamp = new Date().toISOString().slice(0, 10)

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="products-${stamp}.xlsx"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Export failed'
    console.error('[export-products]', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
