export function lineItemRowPath(fieldPath: string): string {
  const parts = fieldPath.split('.')
  parts.pop()
  return parts.join('.')
}

export function isUnsetNumber(value: unknown): boolean {
  return value === null || value === undefined || value === ''
}

export function toFiniteNumber(value: unknown): number | null {
  if (isUnsetNumber(value)) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}
