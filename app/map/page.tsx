'use client'

import dynamic from 'next/dynamic'
import Navbar from '../components/layout/Navbar'
import EventSkeleton from '../components/features/EventSkeleton'

const Map = dynamic(() => import('../components/features/Map'), {
  ssr: false,
  loading: () => (
    <div className="p-6">
      <EventSkeleton />
    </div>
  ),
})

export default function MapPage() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <Navbar />
      <div className="flex-1 overflow-hidden">
        <Map />
      </div>
    </div>
  )
}
