'use client'

import dynamic from 'next/dynamic'
import CharacterSkeleton from '../components/features/CharacterSkeleton'

// Importar el contenido sin SSR y con loading placeholder
const TimelineContent = dynamic(
  () => import('./TimelineContent'),
  {
    ssr: false,
    loading: () => (
      <div className="p-6">
        <CharacterSkeleton />
      </div>
    ),
  }
)

export default function TimelinePage() {
  return <TimelineContent />
}
