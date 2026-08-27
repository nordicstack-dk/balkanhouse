import type { CSSProperties } from 'react'

import {
  getOrdersNeedingAttention,
  waitingFor,
  type AttentionBucket,
} from '@/lib/orders/admin-attention'

// Payload theme variables so the panel reads correctly in both admin themes;
// fallbacks cover the case where they are not defined.
const GOLD = '#c9a227'
const BURGUNDY = '#6b1d2a'

const card: CSSProperties = {
  border: '1px solid var(--theme-elevation-150, #e3e3e3)',
  borderRadius: '10px',
  padding: '20px 24px',
  marginBottom: '24px',
}

const heading: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '10px',
  margin: '0 0 2px',
  fontSize: '1rem',
}

const mutedText: CSSProperties = {
  color: 'var(--theme-elevation-600, #5c5c5c)',
  fontSize: '0.85rem',
  lineHeight: 1.5,
  margin: 0,
}

const rowList: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px',
  listStyle: 'none',
  margin: '16px 0 0',
  padding: 0,
}

const row: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  flex: '1 1 260px',
  minWidth: 0,
  padding: '12px 16px',
  borderRadius: '8px',
  border: '1px solid var(--theme-elevation-150, #e3e3e3)',
  background: 'var(--theme-elevation-50, #fafafa)',
  textDecoration: 'none',
  color: 'inherit',
}

const countStyle: CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums',
  lineHeight: 1,
  minWidth: '2ch',
  textAlign: 'right',
}

function Bucket({ bucket }: { bucket: AttentionBucket }) {
  const waiting = waitingFor(bucket.oldestAt)
  const idle = bucket.count === 0

  return (
    <li style={{ display: 'flex', flex: '1 1 260px', minWidth: 0 }}>
      <a
        href={bucket.href}
        style={{
          ...row,
          borderColor: idle ? 'var(--theme-elevation-150, #e3e3e3)' : GOLD,
        }}
      >
        <span style={{ ...countStyle, color: idle ? 'var(--theme-elevation-400, #9a9a9a)' : BURGUNDY }}>
          {bucket.count}
        </span>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem' }}>
            {bucket.label}
          </span>
          <span style={{ ...mutedText, display: 'block', fontSize: '0.8rem' }}>
            {idle ? 'Nothing waiting' : waiting ? `${bucket.action} · oldest ${waiting}` : bucket.action}
          </span>
        </span>
      </a>
    </li>
  )
}

/** Dashboard panel — the first thing an operator sees after signing in. */
export async function OrdersAttentionPanel() {
  const { buckets, total } = await getOrdersNeedingAttention()

  return (
    <section style={card}>
      <h2 style={heading}>
        <span>Orders needing action</span>
        {total > 0 && (
          <span
            style={{
              background: BURGUNDY,
              color: '#fff',
              borderRadius: '999px',
              padding: '2px 9px',
              fontSize: '0.75rem',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {total}
          </span>
        )}
      </h2>
      <p style={mutedText}>
        {total > 0
          ? 'Waiting on the shop, not on the customer. Each tile opens the orders list filtered to that status.'
          : 'Everything is either shipped or waiting on a customer payment.'}
      </p>
      <ul style={rowList}>
        {buckets.map((bucket) => (
          <Bucket key={bucket.status} bucket={bucket} />
        ))}
      </ul>
    </section>
  )
}

/**
 * Orders list banner. Only renders when something is actually waiting — inside
 * the list the operator is already looking at the orders, so a permanent
 * "nothing to do" strip would just be noise above the table.
 */
export async function OrdersAttentionBanner() {
  const { buckets, total } = await getOrdersNeedingAttention()

  if (total === 0) return null

  return (
    <section
      style={{
        ...card,
        padding: '14px 18px',
        borderLeft: `3px solid ${GOLD}`,
      }}
    >
      <ul style={{ ...rowList, margin: 0, gap: '10px' }}>
        {buckets
          .filter((bucket) => bucket.count > 0)
          .map((bucket) => {
            const waiting = waitingFor(bucket.oldestAt)
            return (
              <li key={bucket.status} style={{ display: 'flex', flex: '1 1 240px', minWidth: 0 }}>
                <a href={bucket.href} style={{ ...row, borderColor: GOLD, padding: '10px 14px' }}>
                  <span style={{ ...countStyle, fontSize: '1.25rem', color: BURGUNDY }}>
                    {bucket.count}
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem' }}>
                      {bucket.label}
                    </span>
                    {waiting && (
                      <span style={{ ...mutedText, display: 'block', fontSize: '0.78rem' }}>
                        oldest {waiting}
                      </span>
                    )}
                  </span>
                </a>
              </li>
            )
          })}
      </ul>
    </section>
  )
}
