import { ALLERGEN_EU_OPTIONS } from '@/lib/contracts'
import type { AllergenEU } from '@/lib/contracts'

const allergenLabels = Object.fromEntries(
  ALLERGEN_EU_OPTIONS.map((o) => [o.value, o.label]),
) as Record<AllergenEU, string>

export function AllergenList({ allergens }: { allergens: AllergenEU[] }) {
  if (!allergens.length) return null

  return (
    <ul className="flex flex-wrap gap-2">
      {allergens.map((a) => (
        <li
          key={a}
          className="rounded-tag bg-cream px-2.5 py-1 text-sm text-text ring-1 ring-line"
          title={allergenLabels[a]}
        >
          {allergenLabels[a]}
        </li>
      ))}
    </ul>
  )
}
