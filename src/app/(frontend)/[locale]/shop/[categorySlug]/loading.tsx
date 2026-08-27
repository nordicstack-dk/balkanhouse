import { ProductGridSkeleton } from '@/components/ui/Skeleton'

// Rendered inside the shop layout, so the search bar, category nav and
// heading stay in place — only the product cards show placeholders.
export default function Loading() {
  return (
    <div aria-busy="true">
      <ProductGridSkeleton count={8} />
    </div>
  )
}
