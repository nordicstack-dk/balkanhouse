/**
 * Diacritic-insensitive product search helpers.
 *
 * Titles and queries are normalized the same way, so "tuica" matches
 * "Țuică", "pain" matches "Pâine" and Danish "blabar" would match
 * "blåbær". Romanian and most Latin diacritics decompose via NFD; the
 * few letters that don't (ø, æ, đ, ł, ß) are mapped explicitly.
 */

const SPECIAL_CHARS: Record<string, string> = {
  ø: 'o',
  æ: 'ae',
  đ: 'd',
  ł: 'l',
  ß: 'ss',
}

export function normalizeForSearch(value: string | null | undefined): string {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[øæđłß]/g, (c) => SPECIAL_CHARS[c] ?? c)
}

/** Every whitespace-separated token of the query must appear in the text. */
export function matchesSearch(text: string | null | undefined, query: string): boolean {
  const normalized = normalizeForSearch(text)
  const tokens = normalizeForSearch(query).split(/\s+/).filter(Boolean)
  if (!tokens.length) return true
  return tokens.every((token) => normalized.includes(token))
}
