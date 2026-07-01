'use client'

import { useEffect, useState } from 'react'
import { api, auth } from '@/lib/api'
import Navbar from '@/app/components/layout/Navbar'
import AdminNav from '@/app/components/layout/AdminNav'
import { useRouter } from 'next/navigation'
import { t } from '@/app/lib/i18n'

export default function PlacesPage() {
  const [places, setPlaces] = useState<any[]>([])
  const [placeTypes, setPlaceTypes] = useState<any[]>([])
  const [frames, setFrames] = useState<any[]>([])
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    place_type_id: '',
    current_name: '',
    previous_name: '',
    lat: '',
    lng: ''
  })
  const router = useRouter()
  
  const currentUser = auth.getUser()
  const isSuperUser = currentUser?.role === 'super_user'

  // Cargar marcos al inicio
  useEffect(() => {
    const loadFrames = async () => {
      try {
        const data = await api.getFrames()
        setFrames(data || [])
      } catch (error) {
        console.error('Error loading frames:', error)
      }
    }
    if (isSuperUser) {
      loadFrames()
    }
  }, [isSuperUser])

  useEffect(() => {
    if (!isSuperUser) {
      router.push('/map')
      return
    }
    fetchData()
  }, [router, isSuperUser, selectedFrameId])

  const fetchData = async () => {
    try {
      let placesData
      if (selectedFrameId) {
        placesData = await api.getPlacesByFrame(selectedFrameId)
      } else {
        placesData = await api.getPlaces()
      }
      const typesData = await api.getPlaceTypes()
      setPlaces(placesData || [])
      setPlaceTypes(typesData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        alert('No hay token de autenticación. Por favor, inicia sesión nuevamente.')
        return
      }
      
      const payload = {
        place_type_id: formData.place_type_id,
        current_name: formData.current_name,
        previous_name: formData.previous_name || null,
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng)
      }
      
      const url = editingItem 
        ? `http://localhost:3001/api/places/${editingItem.id}`
        : 'http://localhost:3001/api/places'
      
      const response = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Error al guardar')
        return
      }
      
      setShowForm(false)
      setEditingItem(null)
      setFormData({ place_type_id: '', current_name: '', previous_name: '', lat: '', lng: '' })
      fetchData()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este lugar?')) return
    
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        alert('No hay token de autenticación. Por favor, inicia sesión nuevamente.')
        return
      }
      
      const response = await fetch(`http://localhost:3001/api/places/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Error al eliminar')
        return
      }
      
      fetchData()
    } catch (error) {
      console.error('Error deleting place:', error)
      alert('Error al eliminar el lugar')
    }
  }

  const handleEdit = (item: any) => {
    setEditingItem(item)
    setFormData({
      place_type_id: item.place_type_id || '',
      current_name: item.current_name,
      previous_name: item.previous_name || '',
      lat: item.lat.toString(),
      lng: item.lng.toString()
    })
    setShowForm(true)
  }

  if (loading) return <div className="p-8 text-center">{t('loading')}</div>

  if (!isSuperUser) {
    return (
      <>
        <Navbar />
        <main className="p-8">
          <div className="text-center py-8 text-red-600">
            Acceso denegado. Se requieren permisos de Administrador.
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
        
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <h2 className="text-2xl font-semibold">Lugares Históricos</h2>
          <div className="flex items-center gap-3">
            {frames.length > 0 && (
              <select
                value={selectedFrameId || ''}
                onChange={e => setSelectedFrameId(e.target.value || null)}
                className="px-3 py-1 border rounded text-sm bg-white"
              >
                <option value="">Todos los marcos</option>
                {frames.map(frame => (
                  <option key={frame.id} value={frame.id}>{frame.name}</option>
                ))}
              </select>
            )}
            <button
              onClick={() => {
                setEditingItem(null)
                setFormData({ place_type_id: '', current_name: '', previous_name: '', lat: '', lng: '' })
                setShowForm(true)
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              + Agregar Lugar
            </button>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">
                {editingItem ? 'Editar Lugar' : 'Agregar Lugar'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <select
                  value={formData.place_type_id}
                  onChange={e => setFormData({ ...formData, place_type_id: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Seleccione un tipo de lugar...</option>
                  {placeTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.icon || '📍'} {type.name}
                    </option>
                  ))}
                </select>
                
                <input
                  type="text"
                  placeholder="Nombre actual *"
                  value={formData.current_name}
                  onChange={e => setFormData({ ...formData, current_name: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
                
                <input
                  type="text"
                  placeholder="Nombre anterior (opcional)"
                  value={formData.previous_name}
                  onChange={e => setFormData({ ...formData, previous_name: e.target.value })}
                  className="w-full p-2 border rounded"
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="any"
                    placeholder="Latitud *"
                    value={formData.lat}
                    onChange={e => setFormData({ ...formData, lat: e.target.value })}
                    className="w-full p-2 border rounded"
                    required
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Longitud *"
                    value={formData.lng}
                    onChange={e => setFormData({ ...formData, lng: e.target.value })}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingItem(null)
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

        <div className="space-y-3">
          {places.map(place => (
            <div key={place.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{place.place_type_icon || '📍'}</span>
                    <h3 className="font-semibold text-lg">{place.current_name}</h3>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {place.place_type_name || 'Sin tipo'}
                    </span>
                  </div>
                  {place.previous_name && (
                    <p className="text-sm text-gray-500">
                      Anteriormente: {place.previous_name}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    📍 {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(place)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(place.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
