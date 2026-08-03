import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

import { getPayloadClient } from '@/lib/payload'
import { syncOrphanBlobMedia } from '@/lib/sync-orphan-blob-media'

export async function POST(request: Request) {
  try {
    const payload = await getPayloadClient()
    const { user } = await payload.auth({ headers: await headers() })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let replaceImages = false
    try {
      const body = (await request.json()) as { replaceImages?: unknown }
      replaceImages = Boolean(body?.replaceImages)
    } catch {
      // Empty body is fine — defaults to replaceImages: false.
    }

    const summary = await syncOrphanBlobMedia(payload, { replaceImages })
    return NextResponse.json(summary)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sync failed'
    console.error('[sync-blob-media]', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
