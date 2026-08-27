import { ProductRailSkeleton, SectionHeadingSkeleton, Skeleton, TextLinesSkeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-16" aria-busy="true">
      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        {/* Double-bezel photo frame */}
        <div className="rounded-shell bg-gradient-to-b from-wood-light/40 to-wood/20 p-1.5">
          <Skeleton className="rounded-core aspect-square w-full" />
        </div>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-10 w-3/4 md:h-12" />
            <div className="mt-4 flex gap-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
          <Skeleton className="h-9 w-40 md:h-10" />
          <Skeleton className="h-12 w-full rounded-full" />
          <TextLinesSkeleton lines={2} />
          <TextLinesSkeleton lines={4} />
        </div>
      </div>
      <div>
        <SectionHeadingSkeleton width="w-52" />
        <ProductRailSkeleton count={4} />
      </div>
    </div>
  )
}
