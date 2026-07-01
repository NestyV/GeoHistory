export default function EventSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 p-4 shadow-sm animate-pulse">
      <div className="h-6 w-1/3 bg-gray-200 rounded mb-3" />
      <div className="h-4 w-full bg-gray-200 rounded mb-2" />
      <div className="h-4 w-5/6 bg-gray-200 rounded mb-4" />
      <div className="h-3 w-1/4 bg-gray-200 rounded" />
    </div>
  )
}
