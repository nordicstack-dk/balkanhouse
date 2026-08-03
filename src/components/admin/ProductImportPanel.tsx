'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState, type CSSProperties, type DragEvent } from 'react'

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

const BURGUNDY = '#6b1d2a'

// Payload theme variables keep the panel readable in both light and dark admin
// themes; the fallbacks cover the case where they are not defined.
const card: CSSProperties = {
  border: '1px solid var(--theme-elevation-150, #e3e3e3)',
  background: 'var(--theme-elevation-0, #fff)',
  borderRadius: '10px',
  padding: '20px 24px',
  marginBottom: '24px',
}

const headingRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '4px',
}

const mutedText: CSSProperties = {
  color: 'var(--theme-elevation-600, #5c5c5c)',
  fontSize: '0.85rem',
  lineHeight: 1.5,
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ProductImportPanel() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [replaceImages, setReplaceImages] = useState(false)
  const [state, setState] = useState<ImportState>({ status: 'idle' })

  const loading = state.status === 'loading'

  function selectFile(next: File | null) {
    setFile(next)
    setState({ status: 'idle' })
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    if (loading) return
    selectFile(event.dataTransfer.files?.[0] ?? null)
  }

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
    <div style={card}>
      <div style={headingRow}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke={BURGUNDY}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="m9 13 6 6M15 13l-6 6" />
        </svg>
        <h3
          style={{
            margin: 0,
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--theme-elevation-800, #1a1a1a)',
          }}
        >
          Import products from Excel
        </h3>
      </div>

      <p style={{ ...mutedText, margin: '0 0 16px' }}>
        Upload a <code>.xlsx</code> or <code>.csv</code> built from the product import template.
        Leave the <code>image</code> column empty and each product is matched to a Media or Blob
        file named after its SKU.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
        onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
        disabled={loading}
        style={{ display: 'none' }}
      />

      {/* Drop zone doubles as the file picker, replacing the unstyled native input. */}
      <div
        onClick={() => !loading && inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault()
          if (!loading) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            if (!loading) inputRef.current?.click()
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          textAlign: 'center',
          padding: '18px',
          borderRadius: '8px',
          border: `1px dashed ${dragging ? BURGUNDY : 'var(--theme-elevation-200, #d4d4d4)'}`,
          background: dragging
            ? 'var(--theme-elevation-50, #faf6f2)'
            : 'var(--theme-elevation-25, #fafafa)',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'border-color .15s ease, background .15s ease',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {file ? (
          <>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke={BURGUNDY}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            <span
              style={{
                fontSize: '0.88rem',
                color: 'var(--theme-elevation-800, #1a1a1a)',
                fontWeight: 500,
              }}
            >
              {file.name}
            </span>
            <span style={{ ...mutedText, fontSize: '0.8rem' }}>({formatSize(file.size)})</span>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                selectFile(null)
                if (inputRef.current) inputRef.current.value = ''
              }}
              disabled={loading}
              style={{
                marginLeft: '4px',
                background: 'none',
                border: 'none',
                padding: '2px 6px',
                color: 'var(--theme-elevation-600, #5c5c5c)',
                fontSize: '0.8rem',
                textDecoration: 'underline',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Remove
            </button>
          </>
        ) : (
          <>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--theme-elevation-400, #8c8c8c)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <path d="m17 8-5-5-5 5M12 3v12" />
            </svg>
            <span style={{ fontSize: '0.88rem', color: 'var(--theme-elevation-700, #333)' }}>
              <strong style={{ color: BURGUNDY }}>Choose a file</strong> or drag it here
            </span>
            <span style={{ ...mutedText, fontSize: '0.8rem' }}>.xlsx, .xls or .csv</span>
          </>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '14px',
        }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--theme-elevation-700, #333)',
            fontSize: '0.85rem',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={replaceImages}
            onChange={(event) => setReplaceImages(event.target.checked)}
            disabled={loading}
            style={{ accentColor: BURGUNDY, cursor: 'inherit' }}
          />
          Replace existing product images
        </label>

        <button
          type="button"
          onClick={runImport}
          disabled={loading || !file}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: BURGUNDY,
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '9px 20px',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: loading || !file ? 'not-allowed' : 'pointer',
            opacity: loading || !file ? 0.5 : 1,
            transition: 'opacity .15s ease',
          }}
        >
          {loading && (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
              style={{ animation: 'bh-admin-spin 0.8s linear infinite' }}
            >
              <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="4" opacity="0.3" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
            </svg>
          )}
          {loading ? 'Importing…' : 'Import'}
        </button>
      </div>

      {state.status === 'success' && (
        <div
          role="status"
          style={{
            marginTop: '14px',
            padding: '10px 14px',
            borderRadius: '6px',
            background: 'rgba(45,106,79,0.08)',
            border: '1px solid rgba(45,106,79,0.25)',
            color: '#2d6a4f',
            fontSize: '0.85rem',
            lineHeight: 1.5,
          }}
        >
          Imported {state.summary.rowCount} row(s) — created {state.summary.created}, updated{' '}
          {state.summary.updated}, images attached {state.summary.imagesAttached}.
          {state.summary.imagesMissing.length > 0 && (
            <div style={{ marginTop: '6px', color: '#8a3b2b' }}>
              No image found for {state.summary.imagesMissing.length} SKU(s):{' '}
              {state.summary.imagesMissing.slice(0, 8).join(', ')}
              {state.summary.imagesMissing.length > 8 ? ' …' : ''}
            </div>
          )}
        </div>
      )}

      {state.status === 'error' && (
        <div
          role="alert"
          style={{
            marginTop: '14px',
            padding: '10px 14px',
            borderRadius: '6px',
            background: 'rgba(155,35,53,0.07)',
            border: '1px solid rgba(155,35,53,0.25)',
            color: '#9b2335',
            fontSize: '0.85rem',
            lineHeight: 1.5,
          }}
        >
          {state.message}
        </div>
      )}

      <style>{`@keyframes bh-admin-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
