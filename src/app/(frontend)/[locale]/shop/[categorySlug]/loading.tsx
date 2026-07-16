import { ProductCardSkeleton } from '@/components/ui/Skeleton'

// Rendered inside the shop layout, so the search bar, category nav and
// heading stay in place — only the product cards show placeholders.
export default function Loading() {
  return (
    <div aria-busy="true">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
