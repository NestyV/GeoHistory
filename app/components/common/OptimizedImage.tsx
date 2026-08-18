/* eslint-disable @next/next/no-img-element */

'use client'

import { useState, useEffect } from 'react'

const convertWikipediaUrl = (url: string): string => {
	if (!url) return url

	if (url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i)) {
		return url
	}

	const esMatch = url.match(/\/media\/Archivo:(.+?)\.(jpg|jpeg|png|gif)/i)
	if (esMatch) {
		const filename = esMatch[1] || ''
		const extension = esMatch[2] || 'jpg'
		if (!filename) return url
		const cleanFilename = filename.replace(/ /g, '_')
		return `https://upload.wikimedia.org/wikipedia/commons/thumb/${cleanFilename.charAt(0)}/${cleanFilename}/${cleanFilename}.${extension}/200px-${cleanFilename}.${extension}`
	}

	const enMatch = url.match(/\/media\/File:(.+?)\.(jpg|jpeg|png|gif)/i)
	if (enMatch) {
		const filename = enMatch[1] || ''
		const extension = enMatch[2] || 'jpg'
		if (!filename) return url
		const cleanFilename = filename.replace(/ /g, '_')
		return `https://upload.wikimedia.org/wikipedia/commons/thumb/${cleanFilename.charAt(0)}/${cleanFilename}/${cleanFilename}.${extension}/200px-${cleanFilename}.${extension}`
	}

	return url
}

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
