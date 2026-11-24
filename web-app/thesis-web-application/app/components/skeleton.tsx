/**
 * Placeholders shown while a page's data loads (the loading.tsx files use them). They copy the
 * real page's shape, so the content settles in without anything jumping. Purely decorative:
 * screen readers just hear "Loading".
 */

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-shimmer rounded-lg bg-[linear-gradient(90deg,#ebe5d6_25%,#f6f1e6_50%,#ebe5d6_75%)] bg-[length:200%_100%] ${className}`}
    />
  );
}

/** The same frame OwnerPage draws: a top bar, then the page body. */
export function SkeletonPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col" role="status" aria-label="Loading">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-line px-4 sm:px-8">
        <Skeleton className="h-9 w-full max-w-[360px]" />
        <Skeleton className="ml-auto size-10 rounded-xl" />
      </div>
      <main className="flex flex-1 flex-col gap-6 px-4 py-5 sm:px-8 sm:py-7">{children}</main>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function SkeletonTitle() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-10 w-56 sm:h-12 sm:w-72" />
      <Skeleton className="h-3.5 w-32" />
    </div>
  );
}

export function SkeletonChips({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-8 w-20 rounded-full" />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col gap-4 rounded-xl border border-line bg-white p-5 ${className}`}>
      <div className="flex items-center gap-3.5">
        <Skeleton className="size-14 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3.5 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export function SkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-xl border border-line bg-white p-3.5"
        >
          <Skeleton className="size-10 rounded-[10px]" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}
