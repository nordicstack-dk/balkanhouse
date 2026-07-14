'use client'

import { Button, toast, useDocumentInfo } from '@payloadcms/ui'
import React, { useCallback, useState } from 'react'

import { ORDER_STATUS } from '@/lib/contracts'

export function CancelPaymentLinkButton() {
  const { id, data, setData } = useDocumentInfo()
  const [loading, setLoading] = useState(false)

  const status = typeof data?.status === 'string' ? data.status : ''
  const paymentLinkUrl = typeof data?.paymentLinkUrl === 'string' ? data.paymentLinkUrl : ''
  const canCancel = status === ORDER_STATUS.AWAITING_PAYMENT && Boolean(id)

  const handleCancel = useCallback(async () => {
    if (!id || loading) {
      return
    }

    const confirmed = window.confirm(
      'Cancel this payment link? The customer will no longer be able to pay on the current link. You can edit the order and send a new link.',
    )
    if (!confirmed) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/orders/${id}/cancel-payment-link`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const body = (await response.json()) as {
        error?: string
        ok?: boolean
        order?: Record<string, unknown>
        sessionCancelled?: boolean
        sessionNotFound?: boolean
      }

      if (!response.ok) {
        toast.error(body.error ?? 'Failed to cancel payment link')
        return
      }

      if (body.order) {
        setData(body.order)
      }

      if (body.sessionNotFound) {
        toast.success('Payment link cleared (session was already expired or removed)')
      } else {
        toast.success('Payment link cancelled — order is ready to edit')
      }
    } catch {
      toast.error('Failed to cancel payment link')
    } finally {
      setLoading(false)
    }
  }, [id, loading, setData])

  if (!id || !canCancel) {
    return null
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <Button buttonStyle="secondary" disabled={loading} onClick={handleCancel} type="button">
        {loading ? 'Cancelling…' : 'Cancel payment link'}
      </Button>
      {paymentLinkUrl && (
        <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.75 }}>
          Cancelling invalidates the link below at Frisbii so the customer cannot pay the old
          amount.
        </p>
      )}
    </div>
  )
}
