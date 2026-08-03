'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type ImportSummary = {
  rowCount: number
  created: number
  updated: number
  imagesAttached: number
  imagesMissing: string[]
}

type ImportState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; summary: ImportSummary }
  | { status: 'error'; message: string }

export function ProductImportPanel() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [replaceImages, setReplaceImages] = useState(false)
  const [state, setState] = useState<ImportState>({ status: 'idle' })

  async function runImport() {
    if (!file) {
      setState({ status: 'error', message: 'Choose an Excel or CSV file first' })
      return
    }

    setState({ status: 'loading' })

    try {
      const body = new FormData()
      body.append('file', file)
      body.append('replaceImages', String(replaceImages))

      const response = await fetch('/api/admin/import-products', {
        method: 'POST',
        credentials: 'include',
        body,
      })

      const data = (await response.json().catch(() => ({}))) as ImportSummary & {
        error?: string
      }

      if (!response.ok) {
        setState({
          status: 'error',
          message: data.error || `Import failed (${response.status})`,
        })
        return
      }

      setState({ status: 'success', summary: data })
      router.refresh()
    } catch (error: unknown) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Import failed',
      })
    }
  }

  return (
    <div
      style={{
        border: '1px solid #e8dcc8',
        borderLeft: '4px solid #6b1d2a',
        background: '#f7f0e6',
        borderRadius: '8px',
        padding: '16px 20px',
        marginBottom: '16px',
      }}
    >
      <h3
        style={{
          margin: '0 0 6px',
          fontSize: '1rem',
          color: '#6b1d2a',
        }}
      >
        Import products from Excel
      </h3>
      <p style={{ margin: '0 0 12px', color: '#5c4a42', lineHeight: 1.45, fontSize: '0.9rem' }}>
        Upload a <code>.xlsx</code> or <code>.csv</code> using the product import template. Empty
        image cells link by SKU to Media or Vercel Blob files named like the SKU.
      </p>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          marginBottom: '10px',
        }}
      >
        <input
          type="file"
          accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null)
            setState({ status: 'idle' })
          }}
          disabled={state.status === 'loading'}
        />

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
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
          onClick={runImport}
          disabled={state.status === 'loading' || !file}
          style={{
            background: '#6b1d2a',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '8px 14px',
            fontSize: '0.9rem',
            cursor: state.status === 'loading' || !file ? 'not-allowed' : 'pointer',
            opacity: state.status === 'loading' || !file ? 0.7 : 1,
          }}
        >
          {state.status === 'loading' ? 'Importing…' : 'Import'}
        </button>
      </div>

      {state.status === 'success' && (
        <div style={{ color: '#3d5c3a', fontSize: '0.9rem', lineHeight: 1.5 }}>
          Imported {state.summary.rowCount} row(s): created {state.summary.created}, updated{' '}
          {state.summary.updated}. Images attached: {state.summary.imagesAttached}.
          {state.summary.imagesMissing.length > 0 && (
            <div style={{ marginTop: '6px', color: '#8a3b2b' }}>
              No image for {state.summary.imagesMissing.length} SKU(s):{' '}
              {state.summary.imagesMissing.slice(0, 8).join(', ')}
              {state.summary.imagesMissing.length > 8 ? ' …' : ''}
            </div>
          )}
        </div>
      )}

      {state.status === 'error' && (
        <p style={{ margin: 0, color: '#8a3b2b', fontSize: '0.9rem' }}>{state.message}</p>
      )}
    </div>
  )
}
