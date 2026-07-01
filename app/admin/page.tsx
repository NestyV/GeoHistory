'use client'

import { useEffect, useState } from 'react'
import { api, auth } from '@/lib/api'
import { HistoricalEvent } from '../types'
import Navbar from '../components/layout/Navbar'
import AdminNav from '../components/layout/AdminNav'
import { useRouter } from 'next/navigation'
import { t } from '@/app/lib/i18n'

export default function AdminPanel() {
  const [pendingEvents, setPendingEvents] = useState<HistoricalEvent[]>([])
  const [frames, setFrames] = useState<any[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const user = auth.getUser()
      
      if (user) {
        setUserRole(user.role || 'regular')
        if (user.role === 'curator' || user.role === 'super_user') {
          fetchPendingEvents()
          fetchFrames()
        } else {
          router.push('/map')
        }
      } else {
        router.push('/auth')
      }
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const fetchPendingEvents = async () => {
    try {
      const data = await api.getPendingEvents()
      setPendingEvents(data || [])
    } catch (error) {
      console.error('Error fetching pending events:', error)
    }
  }

  const fetchFrames = async () => {
    try {
      const data = await api.getFrames()
      setFrames(data || [])
    } catch (error) {
      console.error('Error fetching frames:', error)
    }
  }

  const approveEvent = async (eventId: string) => {
    try {
      await api.approveEvent(eventId)
      fetchPendingEvents()
    } catch (error) {
      console.error('Error approving event:', error)
      alert('Error approving event')
    }
  }

  const rejectEvent = async (eventId: string) => {
    if (confirm('¿Estás seguro de que quieres rechazar y eliminar este evento?')) {
      try {
        await api.deleteEvent(eventId)
        fetchPendingEvents()
      } catch (error) {
        console.error('Error rejecting event:', error)
        alert('Error rejecting event')
      }
    }
  }

  const getFrameName = (frameId: string) => {
    const frame = frames.find(f => f.id === frameId)
    return frame ? frame.name : 'Sin marco'
  }

  const isSuperUser = userRole === 'super_user'

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="p-8">
          <div className="text-center py-8">{t('loading')}</div>
        </main>
      </>
    )
  }

  if (userRole !== 'curator' && userRole !== 'super_user') {
    return (
      <>
        <Navbar />
        <main className="p-8">
          <div className="text-center py-8 text-red-600">
            {t('accessDenied')}
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="p-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{t('adminPanel')}</h1>
        <AdminNav />
        
        <h2 className="text-2xl font-semibold mb-4">
          {t('pendingEvents')} ({pendingEvents.length})
        </h2>
        
        {pendingEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay eventos pendientes para revisar.
          </div>
        ) : (
          <div className="space-y-4">
            {pendingEvents.map((event: any) => (
              <div key={event.id} className="border rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="text-xl font-semibold">{event.title}</h3>
                      {event.frame_id && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          🏛️ {getFrameName(event.frame_id)}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">{event.description}</p>
                    <p className="text-sm text-gray-500">📅 Fecha: {event.event_date}</p>
                    <p className="text-sm text-gray-500">
                      📍 Ubicación: {event.lat.toFixed(4)}, {event.lng.toFixed(4)}
                    </p>
                    <p className="text-sm text-gray-500">
                      👤 Enviado por: {event.users?.full_name || event.users?.email || event.user_id}
                    </p>
                    {event.characters && Array.isArray(event.characters) && event.characters.length > 0 && (
                      <div className="mt-2">
                        <strong>Personajes Históricos:</strong>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {event.characters.map((char: any, idx: number) => (
                            <span key={idx} className="bg-gray-100 px-2 py-1 rounded text-sm">
                              {typeof char === 'string' ? char : char.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => approveEvent(event.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      {t('approve')}
                    </button>
                    <button
                      onClick={() => rejectEvent(event.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                      {t('reject')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isSuperUser && (
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">
              🔧 Panel de Administrador
            </h3>
            <p className="text-sm text-yellow-700 mb-3">
              Esta sección contiene herramientas exclusivas para administradores.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => alert('Función de backup en desarrollo')}
                className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
              >
                📦 Realizar Backup
              </button>
              <button
                onClick={() => alert('Función de restore en desarrollo')}
                className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
              >
                🔄 Restaurar Backup
              </button>
              <button
                onClick={() => alert('Función de configuración en desarrollo')}
                className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
              >
                ⚙️ Configuración
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
