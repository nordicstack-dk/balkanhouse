'use client'

import { Button, toast, useDocumentInfo } from '@payloadcms/ui'
import React, { useCallback, useState } from 'react'

import { ORDER_STATUS } from '@/lib/contracts'

const CANCELLABLE_STATUSES = new Set<string>([ORDER_STATUS.PAID, ORDER_STATUS.SHIPPED])

function appendRefundNote(existingNotes: unknown, refundReference: string): string {
  const trimmedReference = refundReference.trim()
  if (!trimmedReference) {
    return typeof existingNotes === 'string' ? existingNotes : ''
  }

  const noteLine = `[Cancelled after Frisbii refund] ${trimmedReference}`
  const existing = typeof existingNotes === 'string' ? existingNotes.trim() : ''

  return existing ? `${existing}\n${noteLine}` : noteLine
}

export function CancelPaidOrderButton() {
  const { id, data, setData } = useDocumentInfo()
  const [loading, setLoading] = useState(false)
  const [refundReference, setRefundReference] = useState('')

  const status = typeof data?.status === 'string' ? data.status : ''
  const canCancel = CANCELLABLE_STATUSES.has(status) && Boolean(id)

  const handleCancel = useCallback(async () => {
    if (!id || loading || !canCancel) {
      return
    }

    const confirmed = window.confirm(
      'Cancel this paid/shipped order? Issue the refund manually in Frisbii first, then confirm here.',
    )
    if (!confirmed) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: ORDER_STATUS.CANCELLED,
          notes: appendRefundNote(data?.notes, refundReference),
        }),
      })

      const body = (await response.json()) as {
        errors?: Array<{ message?: string }>
        doc?: Record<string, unknown>
        message?: string
      }

      if (!response.ok) {
        const message =
          body.errors?.[0]?.message ?? body.message ?? 'Failed to cancel order'
        toast.error(message)
        return
      }

      if (body.doc) {
        setData(body.doc)
      }

      setRefundReference('')
      toast.success('Order cancelled')
    } catch {
      toast.error('Failed to cancel order')
    } finally {
      setLoading(false)
    }
  }, [canCancel, data?.notes, id, loading, refundReference, setData])

  if (!id || !canCancel) {
    return null
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <span style={{ fontSize: '0.875rem' }}>Frisbii refund reference (optional)</span>
        <textarea
          disabled={loading}
          onChange={(event) => setRefundReference(event.target.value)}
          placeholder="e.g. Frisbii charge ID or refund date"
          rows={2}
          style={{ width: '100%', resize: 'vertical' }}
          value={refundReference}
        />
      </label>
      <Button buttonStyle="secondary" disabled={loading} onClick={handleCancel} type="button">
        {loading ? 'Cancelling…' : 'Cancel order'}
      </Button>
      <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.75 }}>
        Refunds are processed manually in Frisbii. This marks the order cancelled in admin and
        records your refund reference in internal notes.
      </p>
    </div>
  )
}
