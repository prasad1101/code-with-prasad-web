export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />
}

export function CardGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card overflow-hidden">
          <Skeleton className="aspect-[16/9] rounded-none" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ArticleSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading content">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div
      className="mx-auto max-w-6xl px-4 pt-32 pb-20 sm:px-6"
      role="status"
      aria-label="Loading page"
    >
      <Skeleton className="mb-4 h-4 w-32" />
      <Skeleton className="mb-10 h-10 w-2/3" />
      <CardGridSkeleton />
    </div>
  )
}
