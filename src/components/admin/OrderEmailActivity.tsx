'use client'

import { useDocumentInfo } from '@payloadcms/ui'
import React, { useCallback, useEffect, useState } from 'react'

import {
  EMAIL_STATUS,
  EMAIL_STATUS_OPTIONS,
  EMAIL_TYPE_OPTIONS,
  type EmailStatus,
} from '@/lib/contracts'
import type { OrderEmail } from '@/payload-types'

const TYPE_LABELS = new Map(EMAIL_TYPE_OPTIONS.map((o) => [o.value, o.label]))
const STATUS_LABELS = new Map(EMAIL_STATUS_OPTIONS.map((o) => [o.value, o.label]))

const STATUS_COLORS: Record<EmailStatus, { bg: string; fg: string }> = {
  [EMAIL_STATUS.SENT]: { bg: '#e5e7eb', fg: '#374151' },
  [EMAIL_STATUS.DELIVERED]: { bg: '#dbeafe', fg: '#1e40af' },
  [EMAIL_STATUS.OPENED]: { bg: '#dcfce7', fg: '#166534' },
  [EMAIL_STATUS.CLICKED]: { bg: '#bbf7d0', fg: '#14532d' },
  [EMAIL_STATUS.BOUNCED]: { bg: '#fee2e2', fg: '#991b1b' },
  [EMAIL_STATUS.COMPLAINED]: { bg: '#fee2e2', fg: '#991b1b' },
  [EMAIL_STATUS.FAILED]: { bg: '#fee2e2', fg: '#991b1b' },
}

function formatDate(value?: string | null): string {
  if (!value) {
    return '—'
  }
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) {
    return '—'
  }
  return d.toLocaleString()
}

function StatusBadge({ status }: { status: EmailStatus }) {
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS[EMAIL_STATUS.SENT]
  return (
    <span
      style={{
        backgroundColor: colors.bg,
        color: colors.fg,
        borderRadius: '0.25rem',
        padding: '0.125rem 0.5rem',
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'capitalize',
      }}
    >
      {STATUS_LABELS.get(status) ?? status}
    </span>
  )
}

export function OrderEmailActivity() {
  const { id } = useDocumentInfo()
  const [emails, setEmails] = useState<OrderEmail[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) {
      return
    }
    try {
      const response = await fetch(
        `/api/order-emails?where[order][equals]=${encodeURIComponent(String(id))}&sort=-sentAt&depth=0&limit=50`,
        { credentials: 'include' },
      )
      if (!response.ok) {
        setError('Could not load email activity')
        return
      }
      const body = (await response.json()) as { docs?: OrderEmail[] }
      setEmails(body.docs ?? [])
      setError(null)
    } catch {
      setError('Could not load email activity')
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  if (!id) {
    return null
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h4 style={{ margin: 0 }}>Email activity</h4>
        <button
          type="button"
          onClick={() => void load()}
          style={{
            background: 'none',
            border: '1px solid currentColor',
            borderRadius: '0.25rem',
            padding: '0.125rem 0.5rem',
            fontSize: '0.75rem',
            cursor: 'pointer',
            opacity: 0.75,
          }}
        >
          Refresh
        </button>
      </div>

      {error && <p style={{ margin: 0, color: '#991b1b', fontSize: '0.875rem' }}>{error}</p>}

      {emails && emails.length === 0 && (
        <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.75 }}>
          No emails sent for this order yet.
        </p>
      )}

      {emails && emails.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', opacity: 0.7 }}>
                <th style={{ padding: '0.375rem 0.5rem' }}>Email</th>
                <th style={{ padding: '0.375rem 0.5rem' }}>Status</th>
                <th style={{ padding: '0.375rem 0.5rem' }}>Sent</th>
                <th style={{ padding: '0.375rem 0.5rem' }}>Delivered</th>
                <th style={{ padding: '0.375rem 0.5rem' }}>Opened</th>
                <th style={{ padding: '0.375rem 0.5rem' }}>Clicked</th>
              </tr>
            </thead>
            <tbody>
              {emails.map((email) => (
                <tr key={email.id} style={{ borderTop: '1px solid rgba(128,128,128,0.25)' }}>
                  <td style={{ padding: '0.375rem 0.5rem' }}>
                    {TYPE_LABELS.get(email.emailType) ?? email.emailType}
                    <div style={{ opacity: 0.6 }}>{email.to}</div>
                  </td>
                  <td style={{ padding: '0.375rem 0.5rem' }}>
                    <StatusBadge status={email.status as EmailStatus} />
                    {email.lastError && (
                      <div style={{ opacity: 0.6, color: '#991b1b' }}>{email.lastError}</div>
                    )}
                  </td>
                  <td style={{ padding: '0.375rem 0.5rem' }}>{formatDate(email.sentAt)}</td>
                  <td style={{ padding: '0.375rem 0.5rem' }}>{formatDate(email.deliveredAt)}</td>
                  <td style={{ padding: '0.375rem 0.5rem' }}>{formatDate(email.openedAt)}</td>
                  <td style={{ padding: '0.375rem 0.5rem' }}>{formatDate(email.clickedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
