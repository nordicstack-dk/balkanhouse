'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState, type CSSProperties, type DragEvent } from 'react'

type ImportSummary = {
  rowCount: number
  created: number
  updated: number
  imagesAttached: number
  imagesMissing: string[]
  categoriesCreated: string[]
}

/** What one chunk request returns on top of the running totals. */
type ChunkResponse = ImportSummary & {
  processed: number
  nextOffset: number | null
  error?: string
}

type Progress = { done: number; total: number }

type ImportState =
  | { status: 'idle' }
  | { status: 'loading'; progress?: Progress }
  | { status: 'success'; summary: ImportSummary }
  | { status: 'error'; message: string; progress?: Progress }

const BURGUNDY = '#6b1d2a'

// Payload theme variables keep the panel readable in both light and dark admin
// themes; the fallbacks cover the case where they are not defined.
const card: CSSProperties = {
  border: '1px solid var(--theme-elevation-150, #e3e3e3)',
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

    // The file is posted once per chunk with a moving offset. A whole catalogue
    // in a single request exceeds the serverless time limit and 504s partway
    // through, which is how a previous run left 79 of 610 rows applied.
    const totals: ImportSummary = {
      rowCount: 0,
      created: 0,
      updated: 0,
      imagesAttached: 0,
      imagesMissing: [],
      categoriesCreated: [],
    }
    let offset = 0

    try {
      for (;;) {
        const body = new FormData()
        body.append('file', file)
        body.append('replaceImages', String(replaceImages))
        body.append('offset', String(offset))

        const response = await fetch('/api/admin/import-products', {
          method: 'POST',
          credentials: 'include',
          body,
        })

        const data = (await response.json().catch(() => ({}))) as ChunkResponse

        if (!response.ok) {
          const where = offset > 0 ? ` after ${offset} of ${totals.rowCount} rows` : ''
          setState({
            status: 'error',
            message: `${data.error || `Import failed (${response.status})`}${where}. Rows already written are saved — fix the problem and import the same file again to continue.`,
            progress: totals.rowCount ? { done: offset, total: totals.rowCount } : undefined,
          })
          return
        }

        totals.rowCount = data.rowCount
        totals.created += data.created
        totals.updated += data.updated
        totals.imagesAttached += data.imagesAttached
        totals.imagesMissing.push(...(data.imagesMissing ?? []))
        for (const slug of data.categoriesCreated ?? []) {
          if (!totals.categoriesCreated.includes(slug)) totals.categoriesCreated.push(slug)
        }

        if (data.nextOffset == null) break
        offset = data.nextOffset
        setState({ status: 'loading', progress: { done: offset, total: data.rowCount } })
      }

      setState({ status: 'success', summary: totals })
      router.refresh()
    } catch (error: unknown) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Import failed',
        progress: totals.rowCount ? { done: offset, total: totals.rowCount } : undefined,
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

      <p style={{ ...mutedText, margin: '0 0 12px' }}>
        Upload a <code>.xlsx</code> or <code>.csv</code> built from the product import template.
        Leave the <code>image</code> column empty and each product is matched to a Media or Blob
        file named after its SKU.
      </p>

      {/* Download → edit → upload is the usual bulk-edit loop, so the export
          sits with the import rather than somewhere else in the admin. Its
          columns are exactly the ones read back in. */}
      <div style={{ ...mutedText, margin: '0 0 16px' }}>
        {/* A real anchor, not next/link: this is a file download, and a
            client-side navigation would try to render the .xlsx as a route. */}
        <a
          href="/api/admin/export-products"
          download
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: BURGUNDY,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="M7 10l5 5 5-5" />
            <path d="M12 15V3" />
          </svg>
          Download all products as Excel
        </a>
        <span> — edit it and upload it back here to apply the changes in bulk.</span>
      </div>

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
            ? 'var(--theme-elevation-50, #000000)'
            : 'var(--theme-elevation-25, #000000)',
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

      {state.status === 'loading' && state.progress && (
        <div role="status" aria-live="polite" style={{ marginTop: '14px' }}>
          <div
            style={{
              height: '6px',
              borderRadius: '3px',
              background: 'var(--theme-elevation-100, #eee)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.round((state.progress.done / Math.max(1, state.progress.total)) * 100)}%`,
                background: BURGUNDY,
                transition: 'width 200ms ease-out',
              }}
            />
          </div>
          <div
            style={{
              marginTop: '6px',
              fontSize: '0.8rem',
              color: 'var(--theme-elevation-600, #666)',
            }}
          >
            {state.progress.done} / {state.progress.total} rows — keep this tab open
          </div>
        </div>
      )}

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
          {state.summary.categoriesCreated.length > 0 && (
            <div style={{ marginTop: '6px' }}>
              Created {state.summary.categoriesCreated.length} new categor
              {state.summary.categoriesCreated.length === 1 ? 'y' : 'ies'}:{' '}
              {state.summary.categoriesCreated.join(', ')} — rename them under Catalog → Categories.
            </div>
          )}
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
            // The duplicate-SKU error lists one offending row per line.
            whiteSpace: 'pre-line',
          }}
        >
          {state.message}
        </div>
      )}

      <style>{`@keyframes bh-admin-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
