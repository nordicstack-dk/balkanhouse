import clsx from 'clsx'

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('bh-skeleton rounded-tag', className)} aria-hidden />
}

/*
 * The shapes below mirror real page furniture so a loading boundary occupies
 * the same footprint as the content replacing it. Anything that reflows on
 * arrival defeats the point of showing a placeholder at all.
 */

/** Matches the `text-4xl md:text-5xl` h1 used on every inner page. */
export function PageHeadingSkeleton({ width = 'w-72' }: { width?: string }) {
  return <Skeleton className={clsx('mb-8 h-10 md:h-12', width)} />
}

/** Matches the `text-3xl md:text-4xl` h2 used for home sections. */
export function SectionHeadingSkeleton({ width = 'w-56' }: { width?: string }) {
  return <Skeleton className={clsx('mb-8 h-8 md:h-9', width)} />
}

/** Warm paper panel, same radius/ring/elevation as the real thing. */
export function PanelSkeleton({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div
      className={clsx('rounded-core bg-paper shadow-soft ring-1 ring-line/60', className)}
      aria-hidden
    >
      {children}
    </div>
  )
}

export function TextLinesSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={clsx('h-4', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  )
}

/*
 * Mirrors the real ProductCard shell exactly — same radius, surface, ring and
 * elevation — so the grid doesn't visibly reflow when the data lands.
 */
export function ProductCardSkeleton() {
  return (
    <div className="rounded-core flex h-full flex-col overflow-hidden bg-paper shadow-soft ring-1 ring-line/60">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-3.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-14 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

/** Horizontal card rail, matching ProductCarousel's 14rem/16rem track items. */
export function ProductRailSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-4 overflow-hidden pb-4" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="w-56 shrink-0 md:w-64">
          <ProductCardSkeleton />
        </div>
      ))}
    </div>
  )
}

/** Sidebar rows in the shop layout. */
export function CategoryNavSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <aside className="shrink-0 md:w-52" aria-hidden>
      <div className="space-y-1">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="rounded-core h-9 w-full" />
        ))}
      </div>
    </aside>
  )
}

/** The shop/category h1, which resolves from the category list. */
export function ShopHeadingSkeleton() {
  return <Skeleton className="mb-8 h-10 w-64 md:h-12" />
}

/** Two-column category bands on the home page. */
export function CategoryTilesSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 md:gap-4" aria-hidden>
      {Array.from({ length: count }, (_, i) => {
        const isLastOdd = count % 2 === 1 && i === count - 1
        return (
          <Skeleton
            key={i}
            className={clsx('rounded-core min-h-40 md:min-h-44', isLastOdd && 'sm:col-span-2')}
          />
        )
      })}
    </div>
  )
}
