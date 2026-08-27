import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div
      className="rounded-shell mx-auto max-w-lg bg-paper p-10 text-center shadow-lift ring-1 ring-line/60"
      aria-busy="true"
    >
      <Skeleton className="mx-auto mb-6 h-16 w-16 rounded-full" />
      <Skeleton className="mx-auto h-8 w-3/4" />
      <div className="mt-4 space-y-3">
        <Skeleton className="mx-auto h-4 w-full max-w-sm" />
        <Skeleton className="mx-auto h-4 w-2/3" />
      </div>
      <Skeleton className="rounded-core mx-auto mt-6 h-12 w-full" />
      <Skeleton className="mx-auto mt-8 h-12 w-48 rounded-full" />
    </div>
  )
}
