'use client'

import dynamic from 'next/dynamic'

// Mismo patrón que Timeline - SIN loading placeholder
const EventsContent = dynamic(
  () => import('./EventsContent'),
  { ssr: false }
)

export default function EventsPage() {
  return <EventsContent />
}
