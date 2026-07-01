export default function CharacterSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 p-4 shadow-sm animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-gray-200" />
        <div className="flex-1">
          <div className="h-4 w-1/2 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-2/3 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  )
}
