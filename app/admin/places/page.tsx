'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { api, auth } from '@/lib/api'
import Navbar from '@/app/components/layout/Navbar'
import AdminNav from '@/app/components/layout/AdminNav'
import { useRouter } from 'next/navigation'
import { t } from '@/app/lib/i18n'

const isAdminDebugEnabled = (): boolean => {
  if (typeof window === 'undefined') return false

  const params = new URLSearchParams(window.location.search)
  const queryValue = params.get('adminDebug')

  if (queryValue === '1') {
    localStorage.setItem('admin_debug', '1')
    return true
  }

  if (queryValue === '0') {
    localStorage.removeItem('admin_debug')
    return false
  }

  return localStorage.getItem('admin_debug') === '1'
}

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
  const debugRef = useRef(isAdminDebugEnabled())
  const debugLog = useCallback((...args: any[]) => {
    if (debugRef.current) {
      console.log('[ADMIN PLACES]', ...args)
    }
  }, [])

  const currentUser = auth.getUser()
  const isCurator = currentUser?.role === 'curator'
  const isSuperUser = currentUser?.role === 'super_user'
  const isAtLeastCurator = isCurator || isSuperUser

  useEffect(() => {
    debugLog('Initial role state', {
      userId: currentUser?.id,
      role: currentUser?.role,
      isAtLeastCurator,
    })
  }, [currentUser?.id, currentUser?.role, isAtLeastCurator, debugLog])

  useEffect(() => {
    if (!debugRef.current || typeof window === 'undefined') return

    const onError = (event: ErrorEvent) => {
      console.error('[ADMIN PLACES][WINDOW ERROR]', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      })
    }

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[ADMIN PLACES][UNHANDLED REJECTION]', event.reason)
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)

    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [])

  const getPlaceName = (place: any) => place.current_name || place.name || ''
  const getPlacePreviousName = (place: any) => place.previous_name || place.description || ''
  const getPlaceLat = (place: any): number | null => {
    const value = place.lat ?? place.latitude
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  const getPlaceLng = (place: any): number | null => {
    const value = place.lng ?? place.longitude
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  // Cargar marcos al inicio
  useEffect(() => {
    const loadFrames = async () => {
      try {
        const data = await api.getFrames()
        setFrames(data || [])
        debugLog('Frames loaded', { count: (data || []).length })
      } catch (error) {
        console.error('Error loading frames:', error)
        debugLog('Frames load failed', error)
      }
    }
    if (isAtLeastCurator) {
      debugLog('Loading frames for authorized user')
      loadFrames()
    } else {
      debugLog('Skipping frames load due to role gate')
    }
  }, [isAtLeastCurator, debugLog])

  const fetchData = useCallback(async () => {
    try {
      debugLog('Fetch started', { selectedFrameId })
      const [placesResult, typesResult] = await Promise.allSettled([
        selectedFrameId ? api.getPlacesByFrame(selectedFrameId) : api.getPlaces(),
        api.getPlaceTypes(),
      ])

      const placesData = placesResult.status === 'fulfilled' ? placesResult.value : []
      const typesData = typesResult.status === 'fulfilled' ? typesResult.value : []

      if (placesResult.status === 'rejected') {
        console.error('Error loading places:', placesResult.reason)
      }
      if (typesResult.status === 'rejected') {
        console.error('Error loading place types:', typesResult.reason)
      }

      debugLog('Fetch settled', {
        placesStatus: placesResult.status,
        placeTypesStatus: typesResult.status,
        placesCount: placesData.length,
        placeTypesCount: typesData.length,
      })

      setPlaces(placesData || [])
      setPlaceTypes(typesData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      debugLog('Fetch threw', error)
    } finally {
      setLoading(false)
      debugLog('Fetch finished')
    }
  }, [selectedFrameId, debugLog])

  useEffect(() => {
    debugLog('Gate check', {
      role: currentUser?.role,
      isAtLeastCurator,
      hasToken: Boolean(auth.getToken()),
    })

    const hasToken = Boolean(auth.getToken())

    if (!hasToken) {
      debugLog('Redirecting to /auth due to missing/expired token')
      router.push('/auth')
      return
    }

    if (!isAtLeastCurator) {
      debugLog('Redirecting to /map due to missing access')
      router.push('/map')
      return
    }

    debugLog('Authorized, fetching page data')
    fetchData()
  }, [router, isAtLeastCurator, fetchData, currentUser?.role, debugLog])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        alert('No hay token de autenticación. Por favor, inicia sesión nuevamente.')
        return
      }
      
      const payloadBase = {
        place_type_id: formData.place_type_id,
        current_name: formData.current_name,
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng)
      }

      const payload = formData.previous_name
        ? { ...payloadBase, previous_name: formData.previous_name }
        : payloadBase

      if (editingItem) {
        await api.updatePlace(editingItem.id, payload)
      } else {
        await api.createPlace(payload)
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
      
      await api.deletePlace(id)
      
      fetchData()
    } catch (error) {
      console.error('Error deleting place:', error)
      alert('Error al eliminar el lugar')
    }
  }

  const handleEdit = (item: any) => {
    const lat = getPlaceLat(item)
    const lng = getPlaceLng(item)
    setEditingItem(item)
    setFormData({
      place_type_id: item.place_type_id || '',
      current_name: getPlaceName(item),
      previous_name: getPlacePreviousName(item),
      lat: lat != null ? String(lat) : '',
      lng: lng != null ? String(lng) : ''
    })
    setShowForm(true)
  }

  if (loading) return <div className="p-8 text-center">{t('loading')}</div>

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
                  {(() => {
                    const lat = getPlaceLat(place)
                    const lng = getPlaceLng(place)
                    const placeName = getPlaceName(place)
                    const placePrevName = getPlacePreviousName(place)
                    return (
                      <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{place.place_type_icon || '📍'}</span>
                    <h3 className="font-semibold text-lg">{placeName}</h3>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {place.place_type_name || 'Sin tipo'}
                    </span>
                  </div>
                  {placePrevName && (
                    <p className="text-sm text-gray-500">
                      Anteriormente: {placePrevName}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    📍 {lat != null && lng != null ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : 'Sin coordenadas'}
                  </p>
                      </>
                    )
                  })()}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(place)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Editar
                  </button>
                  {isSuperUser && (
                    <button
                      onClick={() => handleDelete(place.id)}
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
