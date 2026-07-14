import { ProductCardSkeleton, Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div aria-busy="true">
      <Skeleton className="mb-6 h-9 w-48" />
      <Skeleton className="mb-8 h-10 w-full max-w-xl" />
      <div className="flex flex-col gap-8 md:flex-row">
        <div className="hidden shrink-0 space-y-2 md:block md:w-48">
          <Skeleton className="h-4 w-24" />
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
        <div className="grid flex-1 grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
