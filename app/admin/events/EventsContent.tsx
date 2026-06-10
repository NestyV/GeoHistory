'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { api, auth } from '@/lib/api'
import Navbar from '@/app/components/Navbar'
import AdminNav from '@/app/components/AdminNav'
import { useRouter } from 'next/navigation'
import { t } from '@/app/lib/i18n'
import OptimizedImage from '@/app/components/OptimizedImage'

const formatDateDisplay = (dateString: string) => {
  if (!dateString) return ''
  const [year, month, day] = dateString.split('T')[0].split('-')
  return `${day}/${month}/${year}`
}

const formatDateForInput = (utcDateString: string) => {
  if (!utcDateString) return ''
  return utcDateString.split('T')[0]
}

export default function EventsContent() {
  const [events, setEvents] = useState<any[]>([])
  const [frames, setFrames] = useState<any[]>([])
  const [characters, setCharacters] = useState<any[]>([])
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
  
  const currentUser = auth.getUser()
  const userRole = currentUser?.role
  const isSuperUser = userRole === 'super_user'
  const isCurator = userRole === 'curator'
  const hasAccess = isSuperUser || isCurator

  const fetchData = useCallback(async () => {
    if (!isMounted.current) return
    try {
      const [eventsData, framesData, charactersData] = await Promise.all([
        api.getEvents(),
        api.getFrames(),
        api.getCharacters()
      ])
      if (isMounted.current) {
        setEvents(eventsData || [])
        setFrames(framesData || [])
        setAllCharacters(charactersData || [])
        
        const years = [...new Set(
          (eventsData || [])
            .map(e => new Date(e.event_date).getFullYear())
        )].sort((a, b) => a - b)
        setAvailableYears(years)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      if (isMounted.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!hasAccess) {
      router.push('/map')
      return
    }
    
    isMounted.current = true
    fetchData()
    
    return () => {
      isMounted.current = false
    }
  }, [router, fetchData, hasAccess])

  const filteredEvents = events
    .filter(event => {
      if (selectedFrameFilter && event.frame_id !== selectedFrameFilter) return false
      if (selectedYearFilter) {
        const eventYear = new Date(event.event_date).getFullYear()
        if (eventYear !== selectedYearFilter) return false
      }
      return true
    })
    .sort((a, b) => {
      const dateA = new Date(a.event_date).getTime()
      const dateB = new Date(b.event_date).getTime()
      return dateA - dateB
    })

  const handleAddCharacter = (character: any) => {
    if (!selectedCharacters.find(c => c.id === character.id)) {
      const updated = [...selectedCharacters, character]
      setSelectedCharacters(updated)
      setFormData({
        ...formData,
        characters: updated.map(c => c.name).join(', ')
      })
    }
  }

  const handleRemoveCharacter = (characterId: string) => {
    const updated = selectedCharacters.filter(c => c.id !== characterId)
    setSelectedCharacters(updated)
    setFormData({
      ...formData,
      characters: updated.map(c => c.name).join(', ')
    })
  }

  const handleCreateNewCharacter = async () => {
    if (!newCharacterName.trim()) return
    
    try {
      const result = await api.createCharacter(newCharacterName, newCharacterDesc, newCharacterImageUrl || null)
      const newChar = result.character || result
      setAllCharacters([...allCharacters, newChar])
      const updated = [...selectedCharacters, newChar]
      setSelectedCharacters(updated)
      setFormData({
        ...formData,
        characters: updated.map(c => c.name).join(', ')
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
    const formattedDate = formatDateForInput(event.event_date)
    
    const eventCharacters = event.characters?.map((c: any) => {
      const charName = typeof c === 'string' ? c : c.name
      const character = allCharacters.find(ch => ch.name === charName)
      return character || { id: charName, name: charName }
    }) || []
    
    setSelectedCharacters(eventCharacters)
    
    setEditingEvent(event)
    setFormData({
      title: event.title,
      description: event.description || '',
      event_date: formattedDate,
      frame_id: event.frame_id || '',
      lat: event.lat.toString(),
      lng: event.lng.toString(),
      characters: eventCharacters.map(c => c.name).join(', ')
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const charactersArray = selectedCharacters.map(c => ({ name: c.name, id: c.id }))
      
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
  if (loading) {
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
                              <img src={char.image_url} alt={char.name} className="w-4 h-4 rounded-full object-cover" />
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
                        const char = allCharacters.find(c => c.id === e.target.value)
                        if (char) handleAddCharacter(char)
                        e.target.value = ''
                      }}
                      className="w-full p-2 border rounded"
                      value=""
                    >
                      <option value="">{t('addCharacter')}</option>
                      {allCharacters
                        .filter(char => !selectedCharacters.find(c => c.id === char.id))
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
                  <p className="text-gray-600 mb-2">{event.description}</p>
                  <p className="text-sm text-gray-500">📅 {formatDateDisplay(event.event_date)}</p>
                  <p className="text-sm text-gray-500">📍 {event.lat.toFixed(4)}, {event.lng.toFixed(4)}</p>
                  {event.characters && event.characters.length > 0 && (
                    <div className="mt-2">
                      <strong className="text-sm">{t('characters')}:</strong>
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
