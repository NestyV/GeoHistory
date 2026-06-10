'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { api, auth } from '@/lib/api'
import Navbar from '@/app/components/Navbar'
import AdminNav from '@/app/components/AdminNav'
import { useRouter } from 'next/navigation'

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [frames, setFrames] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    frame_id: '',
    lat: '',
    lng: '',
    characters: ''
  })
  const router = useRouter()
  const isMounted = useRef(true)
  const user = auth.getUser()
  const isSuperUser = user?.role === 'super_user'
  const isAtLeastCurator = user?.role === 'curator' || user?.role === 'super_user'

  const fetchData = useCallback(async () => {
    if (!isMounted.current) return
    try {
      const [eventsData, framesData] = await Promise.all([
        api.getEvents(),
        api.getFrames()
      ])
      if (isMounted.current) {
        setEvents(eventsData || [])
        setFrames(framesData || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      if (isMounted.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAtLeastCurator) {
      router.push('/map')
      return
    }
    
    isMounted.current = true
    fetchData()
    
    return () => {
      isMounted.current = false
    }
  }, [router, fetchData, isAtLeastCurator])

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      try {
        await api.deleteEvent(id)
        fetchData()
      } catch (error) {
        console.error('Error deleting event:', error)
        alert('Error al eliminar el evento')
      }
    }
  }

  const handleEdit = (event: any) => {
    setEditingEvent(event)
    setFormData({
      title: event.title,
      description: event.description || '',
      event_date: event.event_date.split('T')[0],
      frame_id: event.frame_id || '',
      lat: event.lat.toString(),
      lng: event.lng.toString(),
      characters: Array.isArray(event.characters) 
        ? event.characters.map((c: any) => typeof c === 'string' ? c : c.name).join(', ')
        : ''
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const charactersArray = formData.characters.split(',').map(c => c.trim()).filter(c => c)
      
      const eventData = {
        title: formData.title,
        description: formData.description,
        event_date: formData.event_date,
        frame_id: formData.frame_id || null,
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        characters: charactersArray
      }
      
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:3001/api/events/${editingEvent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventData)
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response:', errorText)
        alert('Error al actualizar el evento')
        return
      }
      
      alert('Evento actualizado correctamente')
      setShowForm(false)
      setEditingEvent(null)
      setFormData({
        title: '',
        description: '',
        event_date: '',
        frame_id: '',
        lat: '',
        lng: '',
        characters: ''
      })
      fetchData()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  const getFrameName = (frameId: string) => {
    const frame = frames.find(f => f.id === frameId)
    return frame ? frame.name : 'Sin marco'
  }

  if (loading) return <div className="p-8 text-center">Cargando...</div>

  if (!isAtLeastCurator) {
    return (
      <>
        <Navbar />
        <main className="p-8">
          <div className="text-center py-8 text-red-600">
            Acceso denegado. Se requieren permisos de Curador o Administrador.
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="p-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Panel de Administración</h1>
        <AdminNav />
        
        <h2 className="text-2xl font-semibold mb-6">Todos los Eventos ({events.length})</h2>
        
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-md w-full my-8">
              <h3 className="text-xl font-bold mb-4">
                {editingEvent ? 'Editar Evento' : 'Agregar Evento'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Título *"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
                <textarea
                  placeholder="Descripción"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
                <input
                  type="date"
                  placeholder="Fecha"
                  value={formData.event_date}
                  onChange={e => setFormData({ ...formData, event_date: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
                <select
                  value={formData.frame_id}
                  onChange={e => setFormData({ ...formData, frame_id: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Sin marco histórico</option>
                  {frames.map(frame => (
                    <option key={frame.id} value={frame.id}>{frame.name}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="any"
                    placeholder="Latitud"
                    value={formData.lat}
                    onChange={e => setFormData({ ...formData, lat: e.target.value })}
                    className="w-full p-2 border rounded"
                    required
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Longitud"
                    value={formData.lng}
                    onChange={e => setFormData({ ...formData, lng: e.target.value })}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <input
                  type="text"
                  placeholder="Personajes (separados por coma)"
                  value={formData.characters}
                  onChange={e => setFormData({ ...formData, characters: e.target.value })}
                  className="w-full p-2 border rounded"
                />
                <div className="flex gap-2 pt-4">
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingEvent(null)
                    }}
                    className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          {events.map(event => (
            <div key={event.id} className="border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-semibold text-lg">{event.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      event.status === 'approved' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {event.status || 'pending'}
                    </span>
                    {event.frame_id && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        🏛️ {getFrameName(event.frame_id)}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-2">{event.description}</p>
                  <p className="text-sm text-gray-500">📅 {new Date(event.event_date).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-500">📍 {event.lat.toFixed(4)}, {event.lng.toFixed(4)}</p>
                  {event.characters && event.characters.length > 0 && (
                    <div className="mt-2">
                      <strong className="text-sm">Personajes:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {event.characters.map((c: any, i: number) => (
                          <span key={i} className="bg-gray-100 text-xs px-2 py-1 rounded">
                            {typeof c === 'string' ? c : c.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(event)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Editar
                  </button>
                  {isSuperUser && (
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
