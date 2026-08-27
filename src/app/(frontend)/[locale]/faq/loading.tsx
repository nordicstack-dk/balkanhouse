import { PageHeadingSkeleton, PanelSkeleton, Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div aria-busy="true">
      <PageHeadingSkeleton width="w-80" />
      <div className="space-y-4">
        {Array.from({ length: 5 }, (_, i) => (
          <PanelSkeleton key={i} className="flex items-center justify-between gap-4 p-6">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          </PanelSkeleton>
        ))}
      </div>
    </div>
  )
}
