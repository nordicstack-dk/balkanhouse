import { PageHeadingSkeleton, PanelSkeleton, Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div aria-busy="true">
      <PageHeadingSkeleton width="w-56" />
      <div className="space-y-6">
        <PanelSkeleton>
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="flex flex-wrap items-center gap-4 p-4">
              <Skeleton className="rounded-tag h-14 w-14 shrink-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-9 w-32 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </PanelSkeleton>
        <PanelSkeleton className="flex flex-col items-end gap-4 p-6">
          <Skeleton className="h-6 w-full max-w-xs" />
          <Skeleton className="h-12 w-full max-w-xs rounded-full" />
        </PanelSkeleton>
      </div>
    </div>
  )
}
