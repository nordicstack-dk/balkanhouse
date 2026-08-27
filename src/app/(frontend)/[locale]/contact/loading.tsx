import { PageHeadingSkeleton, Skeleton, TextLinesSkeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="max-w-3xl" aria-busy="true">
      <PageHeadingSkeleton width="w-56" />
      <div className="mb-10">
        <TextLinesSkeleton lines={2} />
      </div>
      <div
        className="rounded-shell grid gap-8 bg-paper p-8 shadow-soft ring-1 ring-line/60 sm:grid-cols-2"
        aria-hidden
      >
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i}>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2 h-6 w-48" />
          </div>
        ))}
      </div>
    </div>
  )
}
