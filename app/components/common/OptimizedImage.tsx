'use client'

import { useState, useEffect } from 'react'
import { convertWikipediaUrl } from '@/lib/imageUtils'

interface OptimizedImageProps {
	src: string
	alt: string
	className?: string
}

export default function OptimizedImage({ src, alt, className = '' }: OptimizedImageProps) {
	const [isLoaded, setIsLoaded] = useState(false)
	const [hasError, setHasError] = useState(false)
	const [imageSrc, setImageSrc] = useState('')

	useEffect(() => {
		const directUrl = convertWikipediaUrl(src)
		setImageSrc(directUrl)

		if (directUrl && !hasError) {
			const img = new Image()
			img.onload = () => setIsLoaded(true)
			img.onerror = () => setHasError(true)
			img.src = directUrl
		}
	}, [src, hasError])

	if (hasError || !imageSrc) {
		return (
			<div className={`${className} bg-gray-200 flex items-center justify-center text-gray-400 text-xs`}>
				Sin imagen
			</div>
		)
	}

	if (!isLoaded) {
		return <div className={`${className} bg-gray-200 animate-pulse`} />
	}

	return (
		<img
			src={imageSrc}
			alt={alt}
			className={className}
			style={{ display: 'block' }}
		/>
	)
}
