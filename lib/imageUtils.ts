// Helper to convert Wikipedia URLs to direct image URLs
export function convertWikipediaUrl(url: string): string {
  if (!url) return url
  
  // If it's already a direct image URL
  if (url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i)) {
    return url
  }
  
  // Extract filename from Spanish Wikipedia URL
  const esMatch = url.match(/\/media\/Archivo:(.+?)\.(jpg|jpeg|png|gif)/i)
  if (esMatch) {
    const filename = esMatch[1] || ''
    const extension = esMatch[2] || 'jpg'
    if (!filename) return url
    // Replace spaces with underscores and clean filename
    const cleanFilename = filename.replace(/ /g, '_')
    return `https://upload.wikimedia.org/wikipedia/commons/thumb/${cleanFilename.charAt(0)}/${cleanFilename}/${cleanFilename}.${extension}/200px-${cleanFilename}.${extension}`
  }
  
  // Extract filename from English Wikipedia URL
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

// Function to get direct image URL from Wikipedia page URL
export function getWikipediaImageUrl(wikipediaPageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    // This is a helper - for now, we'll just extract from the URL
    // In production, you might want to fetch the page and parse the image
    const directUrl = convertWikipediaUrl(wikipediaPageUrl)
    resolve(directUrl)
  })
}
