'use client'

import dynamic from 'next/dynamic'
import Navbar from '../components/Navbar'

const Map = dynamic(() => import('../components/Map'), { ssr: false })

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