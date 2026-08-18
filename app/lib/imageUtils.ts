// Helper function to convert Wikipedia page URLs to direct image URLs
export function getDirectImageUrl(url: string): string {
  if (!url) return url
  
  // If it's already a direct image URL
  if (url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i)) {
    return url
  }
  
  // Check if it's a Wikipedia page URL
  const wikipediaMatch = url.match(/\/media\/Archivo:(.+?)\.(jpg|jpeg|png|gif)/i)
  if (wikipediaMatch) {
    const filename = wikipediaMatch[1] || ''
    const extension = wikipediaMatch[2] || 'jpg'
    if (!filename) return url
    // Construct the direct Wikimedia URL
    return `https://upload.wikimedia.org/wikipedia/commons/thumb/${filename.charAt(0)}/${filename}/${filename}.${extension}/200px-${filename}.${extension}`
  }
  
  // Check for English Wikipedia
  const enWikipediaMatch = url.match(/\/media\/File:(.+?)\.(jpg|jpeg|png|gif)/i)
  if (enWikipediaMatch) {
    const filename = enWikipediaMatch[1] || ''
    const extension = enWikipediaMatch[2] || 'jpg'
    if (!filename) return url
    return `https://upload.wikimedia.org/wikipedia/commons/thumb/${filename.charAt(0)}/${filename}/${filename}.${extension}/200px-${filename}.${extension}`
  }
  
  return url
}
