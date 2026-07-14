import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div aria-busy="true">
      <Skeleton className="mb-6 h-9 w-48" />
      <div className="space-y-6">
        <div className="space-y-px overflow-hidden rounded-xl border border-cream-dark bg-white">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
        <div className="flex flex-col items-end gap-4 rounded-xl border border-cream-dark bg-white p-6">
          <Skeleton className="h-6 w-full max-w-xs" />
          <Skeleton className="h-12 w-full max-w-xs" />
        </div>
      </div>
    </div>
  )
}
