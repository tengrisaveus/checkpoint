export function CardSkeleton() {
  return (
    <div className="bg-[var(--cp-surf)] rounded-md overflow-hidden animate-pulse border border-[var(--cp-border)]">
      <div className="w-full aspect-[3/4] bg-[var(--cp-surf-2)]" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-[var(--cp-surf-2)] rounded-sm w-3/4" />
        <div className="h-3 bg-[var(--cp-surf-2)] rounded-sm w-1/2" />
      </div>
    </div>
  )
}

export function ListSkeleton() {
  return (
    <div className="bg-[var(--cp-surf)] rounded-lg p-4 flex gap-4 items-center animate-pulse border border-[var(--cp-border)]">
      <div className="w-16 h-20 bg-[var(--cp-surf-2)] rounded-sm" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-[var(--cp-surf-2)] rounded-sm w-1/3" />
        <div className="h-3 bg-[var(--cp-surf-2)] rounded-sm w-1/4" />
      </div>
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div className="flex flex-col md:flex-row gap-8 animate-pulse">
      <div className="w-64 h-80 bg-[var(--cp-surf-2)] rounded-lg" />
      <div className="flex-1 space-y-4">
        <div className="h-8 bg-[var(--cp-surf-2)] rounded-sm w-1/2" />
        <div className="h-4 bg-[var(--cp-surf-2)] rounded-sm w-1/3" />
        <div className="h-4 bg-[var(--cp-surf-2)] rounded-sm w-1/4" />
        <div className="h-20 bg-[var(--cp-surf-2)] rounded-sm w-full" />
      </div>
    </div>
  )
}
