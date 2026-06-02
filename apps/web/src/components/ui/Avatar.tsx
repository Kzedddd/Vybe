'use client'

import Image from 'next/image'

interface AvatarProps {
  src?: string
  alt: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
}

export function Avatar({ src, alt, size = 'md', className = '' }: AvatarProps) {
  const sizeClass = sizeClasses[size]

  if (!src) {
    return (
      <div className={`${sizeClass} ${className} rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-white font-semibold`}>
        {alt.charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <div className={`${sizeClass} ${className} rounded-full overflow-hidden relative`}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
      />
    </div>
  )
}
