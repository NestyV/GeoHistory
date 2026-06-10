'use client'

import dynamic from 'next/dynamic'

// Importar el contenido sin SSR y sin loading placeholder
const TimelineContent = dynamic(
  () => import('./TimelineContent'),
  { ssr: false }
)

export default function TimelinePage() {
  return <TimelineContent />
}
