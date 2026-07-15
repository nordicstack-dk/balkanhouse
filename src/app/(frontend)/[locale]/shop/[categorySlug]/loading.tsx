import { ProductCardSkeleton, Skeleton } from '@/components/ui/Skeleton'

// Rendered inside the shop layout, so the search bar and category nav
// stay in place — only the product area shows placeholders.
export default function Loading() {
  return (
    <div aria-busy="true">
      <Skeleton className="mb-6 h-9 w-48" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
