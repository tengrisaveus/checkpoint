export function CardSkeleton() {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden animate-pulse">
      <div className="w-full h-64 bg-gray-700" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-700 rounded w-1/2" />
      </div>
    </div>
  )
}

export function ListSkeleton() {
  return (
    <div className="bg-gray-800 rounded-lg p-4 flex gap-4 items-center animate-pulse">
      <div className="w-16 h-20 bg-gray-700 rounded" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-700 rounded w-1/3" />
        <div className="h-3 bg-gray-700 rounded w-1/4" />
      </div>
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div className="flex flex-col md:flex-row gap-8 animate-pulse">
      <div className="w-64 h-80 bg-gray-700 rounded-lg" />
      <div className="flex-1 space-y-4">
        <div className="h-8 bg-gray-700 rounded w-1/2" />
        <div className="h-4 bg-gray-700 rounded w-1/3" />
        <div className="h-4 bg-gray-700 rounded w-1/4" />
        <div className="h-20 bg-gray-700 rounded w-full" />
      </div>
    </div>
  )
}