import { PageHeadingSkeleton, TextLinesSkeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="max-w-3xl" aria-busy="true">
      <PageHeadingSkeleton width="w-64" />
      <div className="space-y-8">
        <TextLinesSkeleton lines={4} />
        <TextLinesSkeleton lines={5} />
        <TextLinesSkeleton lines={3} />
      </div>
    </div>
  )
}
