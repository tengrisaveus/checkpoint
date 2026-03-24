export function CardSkeleton() {
  return (
    <div className="bg-slate-900 rounded-lg overflow-hidden animate-pulse border border-slate-800">
      <div className="w-full h-64 bg-slate-800" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-slate-800 rounded w-3/4" />
        <div className="h-3 bg-slate-800 rounded w-1/2" />
      </div>
    </div>
  )
}

export function ListSkeleton() {
  return (
    <div className="bg-slate-900 rounded-lg p-4 flex gap-4 items-center animate-pulse border border-slate-800">
      <div className="w-16 h-20 bg-slate-800 rounded" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-800 rounded w-1/3" />
        <div className="h-3 bg-slate-800 rounded w-1/4" />
      </div>
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div className="flex flex-col md:flex-row gap-8 animate-pulse">
      <div className="w-64 h-80 bg-slate-800 rounded-lg" />
      <div className="flex-1 space-y-4">
        <div className="h-8 bg-slate-800 rounded w-1/2" />
        <div className="h-4 bg-slate-800 rounded w-1/3" />
        <div className="h-4 bg-slate-800 rounded w-1/4" />
        <div className="h-20 bg-slate-800 rounded w-full" />
      </div>
    </div>
  )
}