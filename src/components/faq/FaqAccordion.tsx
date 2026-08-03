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
            className="overflow-hidden rounded-xl border border-cream-dark bg-white"
          >
            <dt>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 p-6 text-left transition-colors hover:bg-cream/50"
              >
                <span className="font-semibold text-text">{item.question}</span>
                <svg
                  className={clsx(
                    'h-5 w-5 shrink-0 text-burgundy transition-transform duration-200',
                    isOpen && 'rotate-180',
                  )}
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="m5 7.5 5 5 5-5"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </dt>
            <dd
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={clsx(
                'grid transition-[grid-template-rows] duration-200 ease-out',
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
              )}
            >
              <div className="overflow-hidden">
                <p className="whitespace-pre-line px-6 pb-6 text-text-muted">{item.answer}</p>
              </div>
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
