'use client'

import { useState } from 'react'

type SyncSummary = {
  blobsScanned: number
  mediaCreated: number
  productsLinked: number
  skipped: number
  errors: string[]
}

type SyncState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; summary: SyncSummary }
  | { status: 'error'; message: string }

export function SyncBlobMediaButton() {
  const [replaceImages, setReplaceImages] = useState(false)
  const [state, setState] = useState<SyncState>({ status: 'idle' })

  async function runSync() {
    setState({ status: 'loading' })

    try {
      const response = await fetch('/api/admin/sync-blob-media', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replaceImages }),
      })

      const data = (await response.json().catch(() => ({}))) as SyncSummary & {
        error?: string
      }

      if (!response.ok) {
        setState({
          status: 'error',
          message: data.error || `Sync failed (${response.status})`,
        })
        return
      }

      setState({ status: 'success', summary: data })
    } catch (error: unknown) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Sync failed',
      })
    }
  }

  return (
    <div
      style={{
        marginTop: '16px',
        paddingTop: '14px',
        borderTop: '1px solid #e8dcc8',
      }}
    >
      <p style={{ margin: '0 0 10px', color: '#5c4a42', lineHeight: 1.45, fontSize: '0.95rem' }}>
        Images uploaded only in Vercel Storage are not Media yet. Sync registers orphan image
        blobs and links them to products when the filename matches the SKU (e.g.{' '}
        <code>12312312333.jpg</code> → SKU <code>12312312333</code>).
      </p>

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
          color: '#5c4a42',
          fontSize: '0.9rem',
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={replaceImages}
          onChange={(event) => setReplaceImages(event.target.checked)}
          disabled={state.status === 'loading'}
        />
        Replace existing product images
      </label>

      <button
        type="button"
        onClick={runSync}
        disabled={state.status === 'loading'}
        style={{
          background: '#6b1d2a',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          padding: '8px 14px',
          fontSize: '0.9rem',
          cursor: state.status === 'loading' ? 'wait' : 'pointer',
          opacity: state.status === 'loading' ? 0.7 : 1,
        }}
      >
        {state.status === 'loading' ? 'Syncing…' : 'Sync blob images'}
      </button>

      {state.status === 'success' && (
        <div style={{ marginTop: '12px', color: '#3d5c3a', fontSize: '0.9rem', lineHeight: 1.5 }}>
          Scanned {state.summary.blobsScanned} image blob(s). Created {state.summary.mediaCreated}{' '}
          media. Linked {state.summary.productsLinked} product(s). Skipped{' '}
          {state.summary.skipped}.
          {state.summary.errors.length > 0 && (
            <div style={{ marginTop: '6px', color: '#8a3b2b' }}>
              {state.summary.errors.length} error(s): {state.summary.errors.slice(0, 3).join(' · ')}
              {state.summary.errors.length > 3 ? ' …' : ''}
            </div>
          )}
        </div>
      )}

      {state.status === 'error' && (
        <p style={{ margin: '12px 0 0', color: '#8a3b2b', fontSize: '0.9rem' }}>{state.message}</p>
      )}
    </div>
  )
}
