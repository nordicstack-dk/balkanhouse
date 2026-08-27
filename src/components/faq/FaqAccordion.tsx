'use client'

import clsx from 'clsx'
import { useState } from 'react'

export type FaqItem = {
  question: string
  answer: string
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <dl className="space-y-4">
      {items.map((item, i) => {
        const isOpen = openIndex === i
        const panelId = `faq-panel-${i}`
        const buttonId = `faq-button-${i}`

        return (
          <div
            key={i}
            className={clsx(
              'rounded-core group overflow-hidden bg-paper shadow-soft ring-1 transition-all duration-500 ease-glide',
              isOpen ? 'ring-gold/45 shadow-lift' : 'ring-line/60 hover:ring-gold/30',
            )}
          >
            <dt>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 p-6 text-left"
              >
                <span
                  className={clsx(
                    'font-semibold transition-colors duration-300',
                    isOpen ? 'text-burgundy' : 'text-text',
                  )}
                >
                  {item.question}
                </span>
                {/* Chevron nested in its own circular well rather than sitting naked
                    beside the label. */}
                <span
                  className={clsx(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-500 ease-spring',
                    isOpen ? 'rotate-180 bg-burgundy text-cream' : 'bg-cream text-burgundy',
                  )}
                  aria-hidden
                >
                  <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
                    <path
                      d="m5 7.5 5 5 5-5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>
            </dt>
            <dd
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              /*
               * The 0fr -> 1fr grid trick this used before never opened: the
               * child is its own scroll container, so it contributes a
               * min-content size of 0 and the `1fr` track stayed collapsed.
               * Animating height against `interpolate-size: allow-keywords`
               * (set in globals.css) is what actually resolves here; browsers
               * without it still open the panel, just without the tween.
               */
              className={clsx(
                'overflow-hidden transition-[height] duration-500 ease-glide',
                isOpen ? 'h-auto' : 'h-0',
              )}
            >
              <div>
                <p className="whitespace-pre-line px-6 pb-6 text-text-muted">{item.answer}</p>
              </div>
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
