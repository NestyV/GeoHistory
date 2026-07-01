'use client'

import { useState, useEffect } from 'react'
import Navbar from './components/layout/Navbar'
import Link from 'next/link'
import { t, getClientLanguage } from '@/app/lib/i18n'

export default function Home() {
  // Estado para evitar errores de hidratación
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Renderizar solo en el cliente después de la hidratación
  if (!isClient) {
    return null
  }

  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-blue-50 to-white">
        <h1 className="text-5xl font-bold mb-4">🌍 GeoHistory</h1>
        <p className="text-xl text-gray-600 mb-8 text-center max-w-2xl">
          {t('homeDescription')}
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/map"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            {t('exploreMap')}
          </Link>
          <Link
            href="/timeline"
            className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
          >
            {t('viewTimeline')}
          </Link>
          <Link
            href="/auth"
            className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            {t('getStarted')}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl">
          <div className="text-center p-6">
            <h2 className="text-2xl font-bold mb-2">📍 {t('featureMarkEvents')}</h2>
            <p className="text-gray-600">{t('featureMarkEventsDesc')}</p>
          </div>
          <div className="text-center p-6">
            <h2 className="text-2xl font-bold mb-2">📅 {t('featureTimeline')}</h2>
            <p className="text-gray-600">{t('featureTimelineDesc')}</p>
          </div>
          <div className="text-center p-6">
            <h2 className="text-2xl font-bold mb-2">👥 {t('featureCollaborate')}</h2>
            <p className="text-gray-600">{t('featureCollaborateDesc')}</p>
          </div>
        </div>
      </main>
    </>
  )
}
