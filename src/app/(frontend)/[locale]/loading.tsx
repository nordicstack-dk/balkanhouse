import {
  CategoryTilesSkeleton,
  ProductRailSkeleton,
  SectionHeadingSkeleton,
  Skeleton,
} from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div aria-busy="true">
      {/* Hero: the wood tray and its inner panel, same radii as the real one. */}
      <div className="rounded-shell bg-gradient-to-b from-wood-light/40 to-wood/20 p-1.5">
        <Skeleton className="rounded-core min-h-[22rem] md:min-h-[26rem]" />
      </div>
      <div className="mt-20 md:mt-28">
        <SectionHeadingSkeleton width="w-48" />
        <ProductRailSkeleton />
      </div>
      <div className="mt-20 md:mt-28">
        <SectionHeadingSkeleton width="w-64" />
        <CategoryTilesSkeleton />
      </div>
    </div>
  )
}
