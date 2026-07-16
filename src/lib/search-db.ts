import { routing } from '@/i18n/routing'

import { getPayloadClient } from './payload'
import { normalizeForSearch } from './search'

/**
 * Database-side product search: diacritic-insensitive and typo-tolerant,
 * backed by the `unaccent` + `pg_trgm` extensions (see scripts/setup-search.ts).
 *
 * A product matches when every query token is either a substring of the
 * normalized title OR a close trigram match (typo tolerance). Substring
 * matches rank above fuzzy ones. The title is resolved with a fallback to
 * the default locale, mirroring Payload's own localization fallback.
 *
 * Throws if the extensions/index are not installed yet; callers fall back
 * to in-process search until scripts/setup-search.ts has been run.
 */

// word_similarity threshold for typo tolerance. Lower = more forgiving.
// 0.4 catches single-letter typos (e.g. "cozonak" -> "cozonac") without
// pulling in unrelated products.
const WORD_SIMILARITY_THRESHOLD = 0.4

type Pool = { query: (text: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> }

async function getPool(): Promise<Pool> {
  const payload = await getPayloadClient()
  const pool = (payload.db as unknown as { pool?: Pool }).pool
  if (!pool?.query) throw new Error('Postgres pool unavailable')
  return pool
}

export type SearchIdResult = { ids: number[]; total: number }

/**
 * Returns the matching product IDs for a page of results plus the total
 * match count. `limit`/`offset` paginate; pass a large limit and offset 0
 * to get all matches.
 */
export async function searchProductIds(
  locale: string,
  opts: { search: string; categoryId?: number; limit: number; offset: number },
): Promise<SearchIdResult> {
  const normalized = normalizeForSearch(opts.search)
  const tokens = normalized.split(/\s+/).filter(Boolean)
  if (!tokens.length) return { ids: [], total: 0 }

  const pool = await getPool()

  // Build the shared CTE with $-parameters. limit/offset are appended after
  // these base params for the rows query; the count query reuses base params.
  const baseParams: unknown[] = []
  const param = (value: unknown) => {
    baseParams.push(value)
    return `$${baseParams.length}`
  }

  const localeParam = param(locale)
  const defaultLocaleParam = param(routing.defaultLocale)
  const categoryFilter =
    opts.categoryId != null ? `AND pr.category_id = ${param(opts.categoryId)}` : ''

  // Each token: substring match OR fuzzy word match.
  const tokenConds = tokens
    .map((t) => {
      const like = param(`%${t}%`)
      const word = param(t)
      return `(n_title LIKE ${like} OR word_similarity(${word}, n_title) >= ${WORD_SIMILARITY_THRESHOLD})`
    })
    .join(' AND ')

  // All-substring flag ranks exact/partial matches above fuzzy-only ones.
  const substringAll = tokens.map((t) => `n_title LIKE ${param(`%${t}%`)}`).join(' AND ')

  const fullQueryParam = param(normalized)

  const cte = `
    WITH base AS (
      SELECT pr.id AS product_id,
             bh_unaccent(COALESCE(req.title, def.title)) AS n_title
      FROM products pr
      LEFT JOIN products_locales req
        ON req._parent_id = pr.id AND req._locale = ${localeParam}
      LEFT JOIN products_locales def
        ON def._parent_id = pr.id AND def._locale = ${defaultLocaleParam}
      WHERE COALESCE(req.title, def.title) IS NOT NULL ${categoryFilter}
    ),
    matched AS (
      SELECT product_id,
             (${substringAll}) AS substr_all,
             word_similarity(${fullQueryParam}, n_title) AS sim
      FROM base
      WHERE ${tokenConds}
    )
  `

  const countResult = await pool.query(`${cte} SELECT count(*)::int AS total FROM matched`, baseParams)
  const total = Number(countResult.rows[0]?.total ?? 0)
  if (!total) return { ids: [], total: 0 }

  const limitParam = `$${baseParams.length + 1}`
  const offsetParam = `$${baseParams.length + 2}`
  const rowsResult = await pool.query(
    `${cte}
     SELECT product_id FROM matched
     ORDER BY substr_all DESC, sim DESC, product_id ASC
     LIMIT ${limitParam} OFFSET ${offsetParam}`,
    [...baseParams, opts.limit, opts.offset],
  )

  const ids = rowsResult.rows.map((r) => Number(r.product_id))
  return { ids, total }
}
