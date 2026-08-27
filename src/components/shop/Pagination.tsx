import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

type PaginationProps = {
  page: number
  totalPages: number
  query?: string
  /** Route the page links target; defaults to the flat shop page. */
  basePath?: string
}

function pageNumbers(page: number, totalPages: number): (number | 'gap')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const wanted = [1, page - 1, page, page + 1, totalPages].filter(
    (p) => p >= 1 && p <= totalPages,
  )
  const sorted = [...new Set(wanted)].sort((a, b) => a - b)
  const out: (number | 'gap')[] = []
  let prev = 0
  for (const p of sorted) {
    if (p - prev > 1) out.push('gap')
    out.push(p)
    prev = p
  }
  return out
}

const pageLinkClassName =
  'bh-nums flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-medium transition-all duration-300 ease-glide'

/* Drawn chevrons rather than the ‹ › glyphs, whose weight and centring drift
   with whatever font happens to render them. */
function Chevron({ back = false }: { back?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={back ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

export function Pagination({ page, totalPages, query, basePath = '/shop' }: PaginationProps) {
  const t = useTranslations('shop')

  if (totalPages <= 1) return null

  const href = (p: number) => ({
    pathname: basePath,
    query: {
      ...(query ? { q: query } : {}),
      ...(p > 1 ? { page: String(p) } : {}),
    },
  })

  return (
    <nav aria-label={t('paginationLabel')} className="mt-12 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          aria-label={t('prevPage')}
          className={`${pageLinkClassName} bg-paper text-burgundy shadow-soft ring-1 ring-line hover:bg-burgundy hover:text-cream hover:shadow-lift hover:ring-burgundy active:scale-95`}
        >
          <Chevron back />
        </Link>
      ) : (
        <span aria-hidden className={`${pageLinkClassName} text-text-muted/35 ring-1 ring-line/50`}>
          <Chevron back />
        </span>
      )}
      {pageNumbers(page, totalPages).map((p, i) =>
        p === 'gap' ? (
          <span key={`gap-${i}`} aria-hidden className="px-1 text-text-muted">
            …
          </span>
        ) : p === page ? (
          <span
            key={p}
            aria-current="page"
            className={`${pageLinkClassName} bg-burgundy font-semibold text-cream shadow-lift`}
          >
            {p}
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            className={`${pageLinkClassName} bg-paper text-text shadow-soft ring-1 ring-line hover:text-burgundy hover:shadow-lift hover:ring-gold/50 active:scale-95`}
          >
            {p}
          </Link>
        ),
      )}
      {page < totalPages ? (
        <Link
          href={href(page + 1)}
          aria-label={t('nextPage')}
          className={`${pageLinkClassName} bg-paper text-burgundy shadow-soft ring-1 ring-line hover:bg-burgundy hover:text-cream hover:shadow-lift hover:ring-burgundy active:scale-95`}
        >
          <Chevron />
        </Link>
      ) : (
        <span aria-hidden className={`${pageLinkClassName} text-text-muted/35 ring-1 ring-line/50`}>
          <Chevron />
        </span>
      )}
    </nav>
  )
}
