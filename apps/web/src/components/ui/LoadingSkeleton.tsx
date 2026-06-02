'use client'

interface LoadingSkeletonProps {
  count?: number
  height?: string
  width?: string
  className?: string
}

export function LoadingSkeleton({
  count = 1,
  height = 'h-4',
  width = 'w-full',
  className = '',
}: LoadingSkeletonProps) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className={`${height} ${width} bg-gray-200 rounded animate-pulse ${className}`}
        />
      ))}
    </>
  )
}

export function EventCardSkeleton() {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md">
      <div className="h-48 bg-gray-200 animate-pulse" />
      <div className="p-4 space-y-3">
        <LoadingSkeleton height="h-5" className="mb-2" />
        <LoadingSkeleton height="h-4" width="w-3/4" />
        <LoadingSkeleton height="h-4" width="w-1/2" />
        <div className="pt-3 border-t border-gray-200">
          <LoadingSkeleton height="h-6" width="w-1/3" />
        </div>
      </div>
    </div>
  )
}
