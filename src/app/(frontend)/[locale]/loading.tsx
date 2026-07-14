import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div aria-busy="true" className="space-y-8">
      <Skeleton className="h-9 w-64" />
      <div className="space-y-4 rounded-xl border border-cream-dark bg-white p-6">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="space-y-4 rounded-xl border border-cream-dark bg-white p-6">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}
