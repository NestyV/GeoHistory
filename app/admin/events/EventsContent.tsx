'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { api, auth } from '@/lib/api'
import Navbar from '@/app/components/layout/Navbar'
import AdminNav from '@/app/components/layout/AdminNav'
import OptimizedImage from '@/app/components/common/OptimizedImage'
import { useRouter } from 'next/navigation'
import { t } from '@/app/lib/i18n'

const formatDateDisplay = (dateString: string) => {
  if (!dateString) return ''
  const datePart = dateString.split('T')[0] || ''
  const [year = '', month = '', day = ''] = datePart.split('-')
  return `${day}/${month}/${year}`
}

const getEventDate = (event: any): string => event.event_date || event.start_date || ''

const getEventCharacters = (event: any): any[] => {
  const rawCharacters = event?.characters
  if (Array.isArray(rawCharacters)) return rawCharacters

  if (typeof rawCharacters === 'string') {
    const trimmed = rawCharacters.trim()
    if (!trimmed) return []

    try {
      const parsed = JSON.parse(trimmed)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return trimmed
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean)
    }
  }

  return []
}

const getEventLat = (event: any): number | null => {
  const value = event.lat ?? event.latitude
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const getEventLng = (event: any): number | null => {
  const value = event.lng ?? event.longitude
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const formatDateForInput = (utcDateString: string) => {
  if (!utcDateString) return ''
  return utcDateString.split('T')[0] || ''
}

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

export default function EventsContent() {
  const [events, setEvents] = useState<any[]>([])
  const [frames, setFrames] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedFrameFilter, setSelectedFrameFilter] = useState<string | null>(null)
  const [selectedYearFilter, setSelectedYearFilter] = useState<number | null>(null)
  const [availableYears, setAvailableYears] = useState<number[]>([])
  
  const [selectedCharacters, setSelectedCharacters] = useState<any[]>([])
  const [allCharacters, setAllCharacters] = useState<any[]>([])
  const [showNewCharacterForm, setShowNewCharacterForm] = useState(false)
  const [newCharacterName, setNewCharacterName] = useState('')
  const [newCharacterDesc, setNewCharacterDesc] = useState('')
  const [newCharacterImageUrl, setNewCharacterImageUrl] = useState('')
  const [userRole, setUserRole] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  
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
  const debugRef = useRef(isAdminDebugEnabled())
  const debugLog = useCallback((...args: any[]) => {
    if (debugRef.current) {
      console.log('[ADMIN EVENTS]', ...args)
    }
  }, [])

  const isSuperUser = userRole === 'super_user'
  const isCurator = userRole === 'curator'
  const hasAccess = isSuperUser || isCurator

  useEffect(() => {
    debugLog('Auth check started')
    const user = auth.getUser()
    if (user?.role) {
      debugLog('Auth user from token', { id: user.id, role: user.role })
      setUserRole(user.role)
    } else {
      setUserRole(null)
      debugLog('No valid auth user found')
    }

    setAuthChecked(true)
  }, [debugLog])

  useEffect(() => {
    if (!debugRef.current || typeof window === 'undefined') return

    const onError = (event: ErrorEvent) => {
      console.error('[ADMIN EVENTS][WINDOW ERROR]', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      })
    }

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[ADMIN EVENTS][UNHANDLED REJECTION]', event.reason)
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)

    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [])

  const fetchData = useCallback(async () => {
    if (!isMounted.current) return
    try {
      debugLog('Fetch started')
      const [approvedEventsResult, pendingEventsResult, framesResult, charactersResult] = await Promise.allSettled([
        api.getEvents(),
        api.getPendingEvents(),
        api.getFrames(),
        api.getCharacters()
      ])

      const approvedEventsData = approvedEventsResult.status === 'fulfilled' ? approvedEventsResult.value : []
      const pendingEventsData = pendingEventsResult.status === 'fulfilled' ? pendingEventsResult.value : []
      const framesData = framesResult.status === 'fulfilled' ? framesResult.value : []
      const charactersData = charactersResult.status === 'fulfilled' ? charactersResult.value : []

      if (approvedEventsResult.status === 'rejected') {
        console.error('Error loading approved events:', approvedEventsResult.reason)
      }
      if (pendingEventsResult.status === 'rejected') {
        console.error('Error loading pending events:', pendingEventsResult.reason)
      }
      if (framesResult.status === 'rejected') {
        console.error('Error loading frames:', framesResult.reason)
      }
      if (charactersResult.status === 'rejected') {
        console.error('Error loading characters:', charactersResult.reason)
      }

      debugLog('Fetch settled', {
        approvedStatus: approvedEventsResult.status,
        pendingStatus: pendingEventsResult.status,
        framesStatus: framesResult.status,
        charactersStatus: charactersResult.status,
        approvedCount: approvedEventsData.length,
        pendingCount: pendingEventsData.length,
        framesCount: framesData.length,
        charactersCount: charactersData.length,
      })

      if (isMounted.current) {
        const combinedEvents = [
          ...(approvedEventsData || []),
          ...(pendingEventsData || []),
        ]

        const dedupedEvents = Array.from(
          new Map(combinedEvents.map((event: any) => [event.id, event])).values()
        )

        setEvents(dedupedEvents)
        setFrames(framesData || [])
        setAllCharacters(charactersData || [])
        
        const years = Array.from(
          new Set<number>(
            dedupedEvents
              .map((e: any) => new Date(getEventDate(e)).getFullYear())
              .filter((year: number) => Number.isFinite(year))
          )
        ).sort((a, b) => a - b)
        setAvailableYears(years)
        debugLog('State updated', {
          dedupedEvents: dedupedEvents.length,
          yearsCount: years.length,
        })
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      debugLog('Fetch threw', error)
    } finally {
      if (isMounted.current) setLoading(false)
      debugLog('Fetch finished')
    }
  }, [debugLog])

  useEffect(() => {
    if (!authChecked) return

    debugLog('Gate check', {
      authChecked,
      userRole,
      hasAccess,
      hasToken: Boolean(auth.getToken()),
    })

    const hasToken = Boolean(auth.getToken())

    if (!hasToken) {
      debugLog('Redirecting to /auth due to missing/expired token')
      router.push('/auth')
      setLoading(false)
      return
    }

    if (!hasAccess) {
      debugLog('Redirecting to /map due to missing access')
      router.push('/map')
      setLoading(false)
      return
    }
    
    isMounted.current = true
    fetchData()
    
    return () => {
      isMounted.current = false
      debugLog('Component unmounted')
    }
  }, [router, fetchData, hasAccess, authChecked, userRole, debugLog])

  const filteredEvents = events
    .filter(event => {
      if (selectedFrameFilter && event.frame_id !== selectedFrameFilter) return false
      if (selectedYearFilter) {
        const eventYear = new Date(getEventDate(event)).getFullYear()
        if (eventYear !== selectedYearFilter) return false
      }
      return true
    })
    .sort((a, b) => {
      const dateA = new Date(getEventDate(a)).getTime()
      const dateB = new Date(getEventDate(b)).getTime()
      return dateA - dateB
    })

  const handleAddCharacter = (character: any) => {
    if (!selectedCharacters.find((c: any) => c.id === character.id)) {
      const updated = [...selectedCharacters, character]
      setSelectedCharacters(updated)
      setFormData({
        ...formData,
        characters: updated.map((c: any) => c.name).join(', ')
      })
    }
  }

  const handleRemoveCharacter = (characterId: string) => {
    const updated = selectedCharacters.filter((c: any) => c.id !== characterId)
    setSelectedCharacters(updated)
    setFormData({
      ...formData,
      characters: updated.map((c: any) => c.name).join(', ')
    })
  }

  const handleCreateNewCharacter = async () => {
    if (!newCharacterName.trim()) return
    
    try {
      const result = await api.createCharacter(
        newCharacterName,
        undefined,
        newCharacterDesc,
        newCharacterImageUrl || undefined,
      )
      const newChar = result.character || result
      setAllCharacters([...allCharacters, newChar])
      const updated = [...selectedCharacters, newChar]
      setSelectedCharacters(updated)
      setFormData({
        ...formData,
        characters: updated.map((c: any) => c.name).join(', ')
      })
      setNewCharacterName('')
      setNewCharacterDesc('')
      setNewCharacterImageUrl('')
      setShowNewCharacterForm(false)
    } catch (error) {
      console.error('Error creating character:', error)
      alert('Error al crear el personaje')
    }
  }

  const handleDelete = async (id: string) => {
    if (!isSuperUser) {
      alert('Solo los administradores pueden eliminar eventos')
      return
    }
    
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
    const formattedDate = formatDateForInput(getEventDate(event))
    const lat = getEventLat(event)
    const lng = getEventLng(event)
    
    const eventCharacters = getEventCharacters(event).map((c: any) => {
      const charName = typeof c === 'string' ? c : c.name
      const character = allCharacters.find(ch => ch.name === charName)
      return character || { id: charName, name: charName }
    })
    
    setSelectedCharacters(eventCharacters)
    
    setEditingEvent(event)
    setFormData({
      title: event.title,
      description: event.description || '',
      event_date: formattedDate,
      frame_id: event.frame_id || '',
      lat: lat != null ? String(lat) : '',
      lng: lng != null ? String(lng) : '',
      characters: eventCharacters.map((c: any) => c.name).join(', ')
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const charactersArray = selectedCharacters.map((c: any) => ({ name: c.name, id: c.id }))
      
      const eventData = {
        title: formData.title,
        description: formData.description,
        event_date: formData.event_date,
        frame_id: formData.frame_id || null,
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        characters: charactersArray
      }
      
      await api.updateEvent(editingEvent.id, eventData)
      
      alert('Evento actualizado correctamente')
      setShowForm(false)
      setEditingEvent(null)
      setSelectedCharacters([])
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

  // Mismo patrón que TimelineContent: mostrar loading state con traducción
  if (!authChecked || loading) {
    return (
      <>
        <Navbar />
        <main className="p-8 max-w-6xl mx-auto">
          <div className="text-center py-8">{t('loading')}</div>
        </main>
      </>
    )
  }

  if (!hasAccess) {
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
        
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <h2 className="text-2xl font-semibold">
            {t('allEvents')} ({filteredEvents.length})
            {isCurator && <span className="text-sm text-gray-500 ml-2">(Modo solo edición)</span>}
          </h2>
          
          <div className="flex gap-3">
            {frames.length > 0 && (
              <select
                value={selectedFrameFilter || ''}
                onChange={(e) => setSelectedFrameFilter(e.target.value || null)}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="">{t('allFramesBtn')}</option>
                {frames.map(frame => (
                  <option key={frame.id} value={frame.id}>{frame.name}</option>
                ))}
              </select>
            )}
            
            {availableYears.length > 0 && (
              <select
                value={selectedYearFilter || ''}
                onChange={(e) => setSelectedYearFilter(e.target.value ? parseInt(e.target.value) : null)}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="">{t('allYearsBtn')}</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-md w-full my-8">
              <h3 className="text-xl font-bold mb-4">
                {editingEvent ? t('editEvent') : t('addEvent')}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                <input
                  type="text"
                  placeholder={t('title')}
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
                <textarea
                  placeholder={t('description')}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
                <input
                  type="date"
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
                  <option value="">{t('historicalFrame')}</option>
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
                
                <div>
                  <label className="block text-sm font-medium mb-1">{t('historicalFigures')}</label>
                  <div className="space-y-2">
                    {selectedCharacters.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {selectedCharacters.map(char => (
                          <span key={char.id} className="bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-1 text-sm">
                            {char.image_url && (
                              <OptimizedImage src={char.image_url} alt={char.name} className="w-4 h-4 rounded-full object-cover" />
                            )}
                            {char.name}
                            <button
                              type="button"
                              onClick={() => handleRemoveCharacter(char.id)}
                              className="text-red-600 hover:text-red-800 ml-1"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <select
                      onChange={e => {
                        const char = allCharacters.find((c: any) => c.id === e.target.value)
                        if (char) handleAddCharacter(char)
                        e.target.value = ''
                      }}
                      className="w-full p-2 border rounded"
                      value=""
                    >
                      <option value="">{t('addCharacter')}</option>
                      {allCharacters
                        .filter((char: any) => !selectedCharacters.find((c: any) => c.id === char.id))
                        .map(char => (
                          <option key={char.id} value={char.id}>
                            {char.name} {char.description ? `- ${char.description.substring(0, 50)}` : ''}
                          </option>
                        ))}
                    </select>

                    {!showNewCharacterForm ? (
                      <button
                        type="button"
                        onClick={() => setShowNewCharacterForm(true)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        + {t('addNewCharacter')}
                      </button>
                    ) : (
                      <div className="border rounded p-3 space-y-2 bg-gray-50">
                        <input
                          type="text"
                          placeholder={t('characterName')}
                          value={newCharacterName}
                          onChange={e => setNewCharacterName(e.target.value)}
                          className="w-full p-1 border rounded text-sm"
                        />
                        <textarea
                          placeholder={t('description')}
                          value={newCharacterDesc}
                          onChange={e => setNewCharacterDesc(e.target.value)}
                          className="w-full p-1 border rounded text-sm"
                          rows={2}
                        />
                        <input
                          type="url"
                          placeholder={t('imageUrl')}
                          value={newCharacterImageUrl}
                          onChange={e => setNewCharacterImageUrl(e.target.value)}
                          className="w-full p-1 border rounded text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleCreateNewCharacter}
                            className="bg-green-600 text-white px-2 py-1 rounded text-sm"
                          >
                            {t('save')}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewCharacterForm(false)
                              setNewCharacterName('')
                              setNewCharacterDesc('')
                              setNewCharacterImageUrl('')
                            }}
                            className="bg-gray-500 text-white px-2 py-1 rounded text-sm"
                          >
                            {t('cancel')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                    {t('save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingEvent(null)
                      setSelectedCharacters([])
                      setShowNewCharacterForm(false)
                    }}
                    className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          {filteredEvents.map(event => (
            <div key={event.id} className="border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {(() => {
                    const lat = getEventLat(event)
                    const lng = getEventLng(event)
                    return (
                      <>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-semibold text-lg">{event.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      event.status === 'approved' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {event.status === 'approved' ? t('approved') : t('pendingApproval')}
                    </span>
                    {event.frame_id && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        🏛️ {getFrameName(event.frame_id)}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-2">{event.description || ''}</p>
                  <p className="text-sm text-gray-500">📅 {formatDateDisplay(getEventDate(event))}</p>
                  <p className="text-sm text-gray-500">
                    📍 {lat != null && lng != null ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : 'Sin coordenadas'}
                  </p>
                  {getEventCharacters(event).length > 0 && (
                    <div className="mt-2">
                      <strong className="text-sm">{t('characters')}:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {getEventCharacters(event).map((c: any, i: number) => (
                          <span key={i} className="bg-gray-100 text-xs px-2 py-1 rounded">
                            {typeof c === 'string' ? c : c.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                      </>
                    )
                  })()}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(event)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    {t('edit')}
                  </button>
                  {isSuperUser && (
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      {t('delete')}
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
