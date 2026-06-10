'use client'

import dynamic from 'next/dynamic'

// Importar el componente Timeline sin SSR
const TimelineContent = dynamic(
  () => import('./page'),
  { ssr: false }
)

export default function TimelineWrapper() {
  return <TimelineContent />
}
