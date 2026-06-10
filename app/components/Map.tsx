'use client'

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { api, auth } from '@/lib/api'
import EventForm from './EventForm'
import OptimizedImage from './OptimizedImage'
import { t } from '@/app/lib/i18n'

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

function MapEventManager({ onAddEvent, onMapMove }: { 
  onAddEvent: (lat: number, lng: number) => void
  onMapMove: (center: L.LatLng, zoom: number) => void
}) {
  const map = useMapEvents({
    contextmenu: (e) => {
      e.originalEvent.preventDefault()
      e.originalEvent.stopPropagation()
      onAddEvent(e.latlng.lat, e.latlng.lng)
      return false
    },
    moveend: () => {
      const center = map.getCenter()
      const zoom = map.getZoom()
      onMapMove(center, zoom)
    },
    zoomend: () => {
      const center = map.getCenter()
      const zoom = map.getZoom()
      onMapMove(center, zoom)
    },
  })
  return null
}

export default function Map() {
  const [events, setEvents] = useState<any[]>([])
  const [frames, setFrames] = useState<any[]>([])
  const [characters, setCharacters] = useState<any[]>([])
  const [showEventForm, setShowEventForm] = useState(false)
  const [newEventLat, setNewEventLat] = useState<number | null>(null)
  const [newEventLng, setNewEventLng] = useState<number | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [years, setYears] = useState<number[]>([])
  
  const [mapCenter, setMapCenter] = useState<[number, number]>([20, 0])
  const [mapZoom, setMapZoom] = useState<number>(2)
  const [userSelectedYear, setUserSelectedYear] = useState(false)
  
  const refreshInterval = useRef<NodeJSoudTimeout | null>(null)
  const isMounted = useRef(true)
  const dataLoaded = useRef(false)
  const saveTimeout = useRef<NodeJSoudTimeout>()

  // Función para guardar preferencias
  const savePreferences = async () => {
    const token = localStorage.getItem('auth_token')
    if (!token || !currentUser) return
    
    const payload = {
      last_frame_id: selectedFrameId,
      last_year: selectedYear,
      last_lat: mapCenter[0],
      last_lng: mapCenter[1],
      last_zoom: mapZoom
    }
    
    try {
      await fetch('http://localhost:3001/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      console.log('💾 Preferencias guardadas:', payload)
    } catch (error) {
      console.error('Error saving preferences:', error)
    }
  }

  // Función para cargar preferencias
  const loadPreferences = async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) return null
    
    try {
      const response = await fetch('http://localhost:3001/api/user/preferences', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.hasPreferences && data.preferences) {
        return data.preferences
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    }
    return null
  }

  // Cargar usuario
  useEffect(() => {
    const user = auth.getUser()
    setCurrentUser(user)
  }, [])

  // Cargar datos y preferencias
  useEffect(() => {
    if (!currentUser) return
    
    const init = async () => {
      setLoading(true)
      
      // Cargar datos
      const [eventsData, framesData, charactersData] = await Promise.all([
        api.getEvents(),
        api.getFrames(),
        api.getCharacters()
      ])
      
      setEvents(eventsData || [])
      setFrames(framesData || [])
      setCharacters(charactersData || [])
      
      // Cargar preferencias
      const prefs = await loadPreferences()
      
      if (prefs) {
        if (prefs.last_frame_id && framesData?.find((f: any) => f.id === prefs.last_frame_id)) {
          setSelectedFrameId(prefs.last_frame_id)
        } else if (framesData && framesData.length > 0) {
          setSelectedFrameId(framesData[0].id)
        }
        
        if (prefs.last_year) {
          setSelectedYear(prefs.last_year)
          setUserSelectedYear(true)
        }
        
        if (prefs.last_lat && prefs.last_lng && prefs.last_zoom) {
          setMapCenter([prefs.last_lat, prefs.last_lng])
          setMapZoom(prefs.last_zoom)
        }
      } else if (framesData && framesData.length > 0) {
        setSelectedFrameId(framesData[0].id)
      }
      
      dataLoaded.current = true
      setLoading(false)
    }
    
    init()
    
    // Refresh periódico de datos
    refreshInterval.current = setInterval(async () => {
      if (isMounted.current) {
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
          console.error('Error refreshing:', error)
        }
      }
    }, 30000)
    
    return () => {
      isMounted.current = false
      if (refreshInterval.current) clearInterval(refreshInterval.current)
    }
  }, [currentUser])

  // Guardar preferencias cuando cambian (con debounce)
  useEffect(() => {
    if (!dataLoaded.current || !currentUser) return
    
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(savePreferences, 1000)
    
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
    }
  }, [selectedFrameId, selectedYear, mapCenter, mapZoom, currentUser, dataLoaded])

  // Actualizar años según el marco seleccionado
  useEffect(() => {
    if (!dataLoaded.current) return
    
    let newYears: number[] = []
    
    if (!selectedFrameId) {
      newYears = [...new Set(
        events.filter(e => e.status === 'approved')
          .map(e => new Date(e.event_date).getFullYear())
      )].sort((a, b) => a - b)
      setYears(newYears)
      
      if (!userSelectedYear && newYears.length > 0 && selectedYear === null) {
        setSelectedYear(newYears[0])
      }
    } else {
      const frameEvents = events.filter(e => 
        e.status === 'approved' && e.frame_id === selectedFrameId
      )
      newYears = [...new Set(
        frameEvents.map(e => new Date(e.event_date).getFullYear())
      )].sort((a, b) => a - b)
      setYears(newYears)
      
      if (selectedYear !== null && !newYears.includes(selectedYear)) {
        setSelectedYear(newYears.length > 0 ? newYears[0] : null)
        setUserSelectedYear(false)
      }
    }
  }, [selectedFrameId, events, selectedYear, userSelectedYear])

  const handleAddEvent = (lat: number, lng: number) => {
    if (!currentUser) {
      alert(t('loginToAdd'))
      return
    }
    setNewEventLat(lat)
    setNewEventLng(lng)
    setShowEventForm(true)
  }

  const handleFrameSelect = (frameId: string | null) => {
    setSelectedFrameId(frameId)
  }

  const handleYearSelect = (year: number | null) => {
    setUserSelectedYear(true)
    setSelectedYear(year)
  }

  const handleMapMove = (center: L.LatLng, zoom: number) => {
    setMapCenter([center.lat, center.lng])
    setMapZoom(zoom)
  }

  const getCharacterDetails = (characterName: string) => {
    const character = characters.find(c => c.name === characterName)
    return character || { name: characterName, image_url: null, description: '' }
  }

  const formatCharacterList = (characterNames: string[]) => {
    if (characterNames.length === 0) return null
    if (characterNames.length === 1) return characterNames[0]
    if (characterNames.length === 2) return characterNames.join(' & ')
    if (characterNames.length === 3) return characterNames.join(', ')
    return `${characterNames.slice(0, 2).join(', ')} & ${characterNames.length - 2} ${t('more')}`
  }

  const filteredEvents = events.filter(e => {
    if (e.status !== 'approved') return false
    if (selectedFrameId && e.frame_id !== selectedFrameId) return false
    if (selectedYear) {
      const eventYear = new Date(e.event_date).getFullYear()
      if (eventYear !== selectedYear) return false
    }
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">{t('loading')}</div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full flex flex-col">
      {frames.length > 0 && (
        <div className="bg-white border-b border-gray-200 shadow-sm z-10 flex-shrink-0">
          <div className="px-2 py-1">
            <div className="flex overflow-x-auto gap-1">
              {frames.map(frame => (
                <button
                  key={frame.id}
                  onClick={() => handleFrameSelect(frame.id)}
                  className={`px-3 py-1 rounded-md text-sm whitespace-nowrap transition-all ${
                    selectedFrameId === frame.id
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title={frame.description || frame.name}
                >
                  {frame.name}
                </button>
              ))}
              <button
                onClick={() => handleFrameSelect(null)}
                className={`px-3 py-1 rounded-md text-sm whitespace-nowrap transition-all ${
                  selectedFrameId === null
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('allFramesBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {years.length > 0 && (
        <div className="bg-white border-b border-gray-200 shadow-sm z-10 flex-shrink-0">
          <div className="px-2 py-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex overflow-x-auto gap-1 flex-1">
                {years.map(year => (
                  <button
                    key={year}
                    onClick={() => handleYearSelect(year)}
                    className={`px-3 py-1 rounded-md text-sm whitespace-nowrap transition-all ${
                      selectedYear === year
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {year}
                  </button>
                ))}
                <button
                  onClick={() => handleYearSelect(null)}
                  className={`px-3 py-1 rounded-md text-sm whitespace-nowrap transition-all ${
                    selectedYear === null
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t('allYearsBtn')}
                </button>
              </div>
              <div className="text-xs text-gray-500 flex-shrink-0">
                {filteredEvents.length} {filteredEvents.length === 1 ? t('event') : t('events')}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 relative">
        <MapContainer
          key={`${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          className="map-container"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CartoDB'
          />
          
          <MapEventManager onAddEvent={handleAddEvent} onMapMove={handleMapMove} />
          
          {filteredEvents.map(event => {
            const characterNames = event.characters?.map((c: any) => typeof c === 'string' ? c : c.name) || []
            const formattedCharacters = formatCharacterList(characterNames)
            
            return (
              <Marker
                key={event.id}
                position={[event.lat, event.lng]}
              >
                <Tooltip 
                  direction="top" 
                  offset={[0, -20]} 
                  opacity={1}
                  permanent={false}
                  sticky={false}
                  interactive={false}
                >
                  <div style={{ 
                    fontSize: '12px', 
                    minWidth: '120px', 
                    maxWidth: '220px',
                    whiteSpace: 'normal',
                    wordWrap: 'break-word'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{event.title}</div>
                    <div style={{ fontSize: '10px', color: '#666' }}>📅 {new Date(event.event_date).getFullYear()}</div>
                    {formattedCharacters && (
                      <div style={{ fontSize: '10px', marginTop: '4px' }}>
                        <span style={{ fontWeight: 'bold' }}>{t('figures')}:</span> {formattedCharacters}
                      </div>
                    )}
                  </div>
                </Tooltip>
                
                <Popup>
                  <div className="max-w-xs">
                    <strong className="text-lg">{event.title}</strong><br />
                    <span className="text-sm text-gray-600">📅 {new Date(event.event_date).toLocaleDateString()}</span><br />
                    {event.description && (
                      <em className="text-sm text-gray-700">{event.description.substring(0, 150)}</em>
                    )}<br />
                    {event.frame_id && (
                      <div className="text-xs text-gray-500 mt-1">
                        🏛️ {t('historicalFrame')}: {frames.find(f => f.id === event.frame_id)?.name || 'Desconocido'}
                      </div>
                    )}
                    {event.characters && event.characters.length > 0 && (
                      <>
                        <hr className="my-2" />
                        <strong className="text-sm">{t('historicalFigures')}:</strong>
                        <div className="mt-2 space-y-2">
                          {event.characters.map((c: any, i: number) => {
                            const charName = typeof c === 'string' ? c : c.name
                            const charDetails = getCharacterDetails(charName)
                            return (
                              <div key={i} className="flex items-center gap-2">
                                {charDetails.image_url && (
                                  <OptimizedImage 
                                    src={charDetails.image_url} 
                                    alt={charName} 
                                    className="w-8 h-8 rounded-full object-cover border border-gray-300"
                                  />
                                )}
                                <div className="flex-1">
                                  <div className="text-sm font-medium">{charName}</div>
                                  {charDetails.description && (
                                    <div className="text-xs text-gray-500">{charDetails.description.substring(0, 60)}</div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>

      {showEventForm && newEventLat && newEventLng && (
        <EventForm
          lat={newEventLat}
          lng={newEventLng}
          onClose={() => {
            setShowEventForm(false)
            setNewEventLat(null)
            setNewEventLng(null)
          }}
          onSuccess={() => {
            const refresh = async () => {
              try {
                const [eventsData, framesData, charactersData] = await Promise.all([
                  api.getEvents(),
                  api.getFrames(),
                  api.getCharacters()
                ])
                setEvents(eventsData || [])
                setFrames(framesData || [])
                setCharacters(charactersData || [])
              } catch (error) {
                console.error('Error refreshing data:', error)
              }
              setShowEventForm(false)
              setNewEventLat(null)
              setNewEventLng(null)
            }
            refresh()
          }}
          frames={frames}
          onFrameCreated={async () => {
            const framesData = await api.getFrames()
            setFrames(framesData || [])
          }}
        />
      )}
    </div>
  )
}
