'use client'

import type { ReactNode } from 'react'
import { useLinkStatus } from 'next/link'
import clsx from 'clsx'

/*
 * Each component here must be rendered inside a <Link>. next-intl's Link wraps
 * next/link, so useLinkStatus works through the localised Link too.
 */

/** Swaps content while the enclosing link is navigating — e.g. arrow → spinner. */
export function LinkPending({ idle, pending }: { idle: ReactNode; pending: ReactNode }) {
  const status = useLinkStatus()
  return <>{status.pending ? pending : idle}</>
}

/** Hairline along the bottom edge of the nearest positioned ancestor. */
export function LinkPendingEdge({ className }: { className?: string }) {
  const { pending } = useLinkStatus()
  if (!pending) return null
  return <span className={clsx('bh-link-sweep', className)} aria-hidden />
}

/** For links whose idle state already draws a rule, so they own the markup. */
export function useLinkPending(): boolean {
  return useLinkStatus().pending
}
