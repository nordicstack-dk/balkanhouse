'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Global navigation progress bar.
 *
 * The App Router exposes no "navigation started" event — `useLinkStatus` only
 * reports the link it is rendered inside, and `usePathname` changes only once a
 * navigation has already committed. So the start is detected from the click
 * itself, in the capture phase, and the end from the committed path.
 *
 * Deliberately narrow about what counts as a navigation: anything the browser
 * would handle itself (new tab, download, modified click, external host, pure
 * hash change) is ignored, so the bar never appears for something that isn't a
 * client-side route change.
 */
type State = 'idle' | 'loading' | 'done'

/** Safety net: clear the bar if a navigation never commits (aborted, blocked). */
const STUCK_TIMEOUT_MS = 20_000

export function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [state, setState] = useState<State>('idle')

  // The route the bar was started from, so a commit to the *same* URL (a
  // re-click, or a nav the router resolved from cache with no change) still
  // resolves rather than leaving the bar hanging.
  const startedFrom = useRef<string | null>(null)
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stuckTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function clearTimers() {
      if (doneTimer.current) clearTimeout(doneTimer.current)
      if (stuckTimer.current) clearTimeout(stuckTimer.current)
    }

    function begin(from: string) {
      clearTimers()
      startedFrom.current = from
      setState('loading')
      stuckTimer.current = setTimeout(() => {
        startedFrom.current = null
        setState('idle')
      }, STUCK_TIMEOUT_MS)
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented) return
      if (event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const anchor = (event.target as Element | null)?.closest?.('a')
      if (!(anchor instanceof HTMLAnchorElement)) return
      if (anchor.target && anchor.target !== '_self') return
      if (anchor.hasAttribute('download')) return

      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#')) return

      let url: URL
      try {
        url = new URL(anchor.href, window.location.href)
      } catch {
        return
      }
      if (url.origin !== window.location.origin) return
      // Same page, different fragment: the browser scrolls, no route change.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return

      begin(window.location.pathname + window.location.search)
    }

    function onPopState() {
      begin(window.location.pathname + window.location.search)
    }

    document.addEventListener('click', onClick, true)
    window.addEventListener('popstate', onPopState)
    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('popstate', onPopState)
      clearTimers()
    }
  }, [])

  // A committed route change ends the bar.
  useEffect(() => {
    if (state !== 'loading') return

    const current = pathname + (searchParams.toString() ? `?${searchParams}` : '')
    if (startedFrom.current === current) return

    startedFrom.current = null
    if (stuckTimer.current) clearTimeout(stuckTimer.current)
    setState('done')
    doneTimer.current = setTimeout(() => setState('idle'), 500)
    // `state` is intentionally read but not depended on: this must fire on route
    // change only, or the 'done' transition would immediately re-enter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])

  if (state === 'idle') return null

  return <div className="bh-nav-progress" data-state={state} role="presentation" aria-hidden />
}
