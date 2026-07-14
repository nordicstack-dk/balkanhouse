'use client'

import { useLinkStatus } from 'next/link'

import { Spinner } from './Spinner'

/**
 * Renders a spinner while the enclosing <Link> navigation is pending.
 * Must be placed inside a Link. The short fade-in delay avoids a
 * flash on near-instant navigations.
 */
export function LinkPendingSpinner({ className = 'h-4 w-4' }: { className?: string }) {
  const { pending } = useLinkStatus()
  if (!pending) return null
  return (
    <span className="bh-appear-delayed inline-flex">
      <Spinner className={className} />
    </span>
  )
}
