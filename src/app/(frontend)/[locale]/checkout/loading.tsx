import { PageHeadingSkeleton, PanelSkeleton, Skeleton } from '@/components/ui/Skeleton'

// Two equal columns, matching CheckoutForm's `grid gap-8 lg:grid-cols-2`.
export default function Loading() {
  return (
    <div aria-busy="true">
      <PageHeadingSkeleton width="w-64" />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          {Array.from({ length: 3 }, (_, panel) => (
            <PanelSkeleton key={panel} className="space-y-4 p-6">
              <Skeleton className="h-4 w-32" />
              {Array.from({ length: 3 }, (_, field) => (
                <Skeleton key={field} className="rounded-core h-11 w-full" />
              ))}
            </PanelSkeleton>
          ))}
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
        <PanelSkeleton className="space-y-4 p-6">
          <Skeleton className="h-4 w-28" />
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="rounded-tag h-10 w-10 shrink-0" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
          <Skeleton className="h-6 w-full" />
        </PanelSkeleton>
      </div>
    </div>
  )
}
