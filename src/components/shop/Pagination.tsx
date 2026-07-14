import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

type PaginationProps = {
  page: number
  totalPages: number
  query?: string
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
  'flex h-10 min-w-10 items-center justify-center rounded-lg border px-2 text-sm font-medium transition-colors'

export function Pagination({ page, totalPages, query }: PaginationProps) {
  const t = useTranslations('shop')

  if (totalPages <= 1) return null

  const href = (p: number) => ({
    pathname: '/shop' as const,
    query: {
      ...(query ? { q: query } : {}),
      ...(p > 1 ? { page: String(p) } : {}),
    },
  })

  return (
    <nav aria-label={t('paginationLabel')} className="mt-8 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          aria-label={t('prevPage')}
          className={`${pageLinkClassName} border-cream-dark bg-white text-burgundy hover:border-burgundy hover:bg-burgundy hover:text-cream`}
        >
          ‹
        </Link>
      ) : (
        <span aria-hidden className={`${pageLinkClassName} border-cream-dark text-text-muted/40`}>
          ‹
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
            className={`${pageLinkClassName} border-burgundy bg-burgundy text-cream shadow-sm`}
          >
            {p}
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            className={`${pageLinkClassName} border-cream-dark bg-white text-text hover:border-burgundy hover:text-burgundy`}
          >
            {p}
          </Link>
        ),
      )}
      {page < totalPages ? (
        <Link
          href={href(page + 1)}
          aria-label={t('nextPage')}
          className={`${pageLinkClassName} border-cream-dark bg-white text-burgundy hover:border-burgundy hover:bg-burgundy hover:text-cream`}
        >
          ›
        </Link>
      ) : (
        <span aria-hidden className={`${pageLinkClassName} border-cream-dark text-text-muted/40`}>
          ›
        </span>
      )}
    </nav>
  )
}
