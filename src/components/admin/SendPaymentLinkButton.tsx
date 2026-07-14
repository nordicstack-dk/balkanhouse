'use client'

import { Button, toast, useDocumentInfo } from '@payloadcms/ui'
import React, { useCallback, useState } from 'react'

import { ORDER_STATUS } from '@/lib/contracts'

export function SendPaymentLinkButton() {
  const { id, data, setData } = useDocumentInfo()
  const [loading, setLoading] = useState(false)

  const status = typeof data?.status === 'string' ? data.status : ''
  const paymentLinkUrl = typeof data?.paymentLinkUrl === 'string' ? data.paymentLinkUrl : ''
  const canSend = status === ORDER_STATUS.AWAITING_CONFIRMATION && Boolean(id)

  const handleSend = useCallback(async () => {
    if (!id || loading) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/orders/${id}/send-payment-link`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const body = (await response.json()) as {
        error?: string
        ok?: boolean
        paymentLinkUrl?: string
        order?: Record<string, unknown>
        emailSent?: boolean
        emailError?: string
      }

      if (!response.ok) {
        toast.error(body.error ?? 'Failed to send payment link')
        return
      }

      if (body.order) {
        setData(body.order)
      }

      if (body.emailSent === false) {
        toast.error(
          body.emailError
            ? `Payment link created, but email failed: ${body.emailError}`
            : 'Payment link created, but email could not be sent',
        )
      } else {
        toast.success('Payment link sent by email')
      }

      if (body.paymentLinkUrl) {
        console.log('[admin] Payment link:', body.paymentLinkUrl)
      }
    } catch {
      toast.error('Failed to send payment link')
    } finally {
      setLoading(false)
    }
  }, [id, loading, setData])

  if (!id) {
    return null
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <Button buttonStyle="primary" disabled={!canSend || loading} onClick={handleSend} type="button">
        {loading ? 'Creating link…' : 'Send payment link'}
      </Button>
      {!canSend && status !== ORDER_STATUS.AWAITING_CONFIRMATION && (
        <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.75 }}>
          Available when order status is awaiting confirmation.
        </p>
      )}
      {paymentLinkUrl && (
        <p style={{ margin: 0, fontSize: '0.875rem', wordBreak: 'break-all' }}>
          Link:{' '}
          <a href={paymentLinkUrl} rel="noreferrer" target="_blank">
            {paymentLinkUrl}
          </a>
        </p>
      )}
    </div>
  )
}
