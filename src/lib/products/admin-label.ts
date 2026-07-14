export function resolveLocalizedString(value: unknown, locale?: string | null): string {
  if (typeof value === 'string') {
    return value.trim()
  }

  if (value && typeof value === 'object' && locale) {
    const localized = (value as Record<string, unknown>)[locale]
    if (typeof localized === 'string') {
      return localized.trim()
    }
  }

  return ''
}

export function formatProductAdminLabel(sku: unknown, title: unknown): string {
  const normalizedSku = typeof sku === 'string' ? sku.trim() : ''
  const normalizedTitle = typeof title === 'string' ? title.trim() : ''

  if (normalizedSku && normalizedTitle) {
    return `${normalizedSku} — ${normalizedTitle}`
  }

  if (normalizedTitle) {
    return normalizedTitle
  }

  if (normalizedSku) {
    return normalizedSku
  }

  return ''
}
