'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
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

const formatDateDMY = (dateString: string) => {
  if (!dateString) return ''
  const datePart = dateString.split('T')[0] || ''
  const [year = '', month = '', day = ''] = datePart.split('-')
  return `${day}/${month}/${year}`
}

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
  
  // Estado para controlar el popup (click) y tooltip (hover)
  const [activePopup, setActivePopup] = useState<string | null>(null)
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null)
  
  const [mapCenter, setMapCenter] = useState<[number, number]>([20, 0])
  const [mapZoom, setMapZoom] = useState<number>(2)
  const [userSelectedYear, setUserSelectedYear] = useState(false)
  
  const refreshInterval = useRef<NodeJS.Timeout | null>(null)
  const isMounted = useRef(true)
  const dataLoaded = useRef(false)
  const saveTimeout = useRef<NodeJS.Timeout>()
  const mapRef = useRef<L.Map | null>(null)
  const markerRefs = useRef<Record<string, L.Marker | null>>({})

  const savePreferences = useCallback(async () => {
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
      await api.saveUserPreferences(payload)
    } catch (error) {
      console.error('Error saving preferences:', error)
    }
  }, [currentUser, selectedFrameId, selectedYear, mapCenter, mapZoom])

  const loadPreferences = async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) return null
    
    try {
      const data = await api.getUserPreferences()
      if (data.hasPreferences && data.preferences) {
        return data.preferences
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    }
    return null
  }

  useEffect(() => {
    const user = auth.getUser()
    setCurrentUser(user)
  }, [])

  useEffect(() => {
    isMounted.current = true

    const init = async () => {
      setLoading(true)

      try {
        const [eventsData, framesData, charactersData] = await Promise.all([
          api.getEvents(),
          api.getFrames(),
          api.getCharacters()
        ])

        if (isMounted.current) {
          setEvents(eventsData || [])
          setFrames(framesData || [])
          setCharacters(charactersData || [])
        }

        const prefs = currentUser ? await loadPreferences() : null

        if (prefs) {
          if (prefs.last_frame_id && framesData?.find((f: any) => f.id === prefs.last_frame_id)) {
            setSelectedFrameId(prefs.last_frame_id)
          } else if (framesData && framesData.length > 0) {
            setSelectedFrameId(framesData[0]?.id ?? null)
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
          setSelectedFrameId(framesData[0]?.id ?? null)
        }
      } catch (error) {
        console.error('Error loading map data:', error)
      } finally {
        dataLoaded.current = true
        if (isMounted.current) setLoading(false)
      }
    }
    
    init()
    
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

  useEffect(() => {
    if (!dataLoaded.current || !currentUser) return
    
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(savePreferences, 1000)
    
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
    }
  }, [selectedFrameId, selectedYear, mapCenter, mapZoom, currentUser, savePreferences])

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
        setSelectedYear(newYears[0] ?? null)
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
        setSelectedYear(newYears.length > 0 ? (newYears[0] ?? null) : null)
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
    return character || { name: characterName, alias: null, image_url: null, description: '' }
  }

  // Para el tooltip (hover): muestra nombre + alias si existe
  const getTooltipDisplayName = (characterName: string) => {
    const details = getCharacterDetails(characterName)
    if (details.alias) {
      return `${details.name} (${details.alias})`
    }
    return details.name
  }

  // Para el popup (click): SOLO el alias, o el nombre si no tiene alias
  const getPopupDisplayName = (characterName: string) => {
    const details = getCharacterDetails(characterName)
    return details.alias || details.name
  }

  const formatLocation = (lat: number | null, lng: number | null) => {
    if (lat == null || lng == null) {
      return '📍 Sin coordenadas'
    }
    return `📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }

  const formatTooltipCharacterList = (characterNames: string[]) => {
    if (characterNames.length === 0) return null
    if (characterNames.length === 1) return getTooltipDisplayName(characterNames[0] ?? '')
    if (characterNames.length === 2) return characterNames.map(n => getTooltipDisplayName(n)).join(' & ')
    if (characterNames.length === 3) return characterNames.map(n => getTooltipDisplayName(n)).join(', ')
    return `${characterNames.slice(0, 2).map(n => getTooltipDisplayName(n)).join(', ')} & ${characterNames.length - 2} ${t('more')}`
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

  // Handlers para exclusión mutua
  const handleMarkerClick = (eventId: string) => {
    setActivePopup(eventId)
    setHoveredEvent(null)
  }

  useEffect(() => {
    Object.entries(markerRefs.current).forEach(([eventId, marker]) => {
      if (!marker) return
      if (activePopup && eventId === activePopup) {
        marker.openPopup()
      } else {
        marker.closePopup()
      }
    })
  }, [activePopup])

  useEffect(() => {
    if (!activePopup) {
      setHoveredEvent(null)
      return
    }

    const marker = markerRefs.current[activePopup]
    if (marker) {
      marker.openPopup()
    }
  }, [activePopup, filteredEvents])

  const handleMarkerHover = (eventId: string) => {
    if (!activePopup) {
      setHoveredEvent(eventId)
    }
  }

  const handleMarkerLeave = () => {
    setHoveredEvent(null)
  }

  // Renderizar tooltip personalizado (no de Leaflet)
  const renderCustomTooltip = (event: any) => {
    if (hoveredEvent !== String(event.id)) return null
    
    const characterNames = event.characters?.map((c: any) => typeof c === 'string' ? c : c.name) || []
    const formattedCharacters = formatTooltipCharacterList(characterNames)
    
    const placeDisplayText = event.place_name 
      ? `${event.place_type_icon || '📍'} ${event.place_name}`
      : `📍 ${event.lat.toFixed(4)}, ${event.lng.toFixed(4)}`
    
    // Convert marker position from map container coordinates to viewport coordinates.
    if (!mapRef.current) return null
    const mapContainer = mapRef.current.getContainer()
    const mapRect = mapContainer.getBoundingClientRect()
    const point = mapRef.current.latLngToContainerPoint(L.latLng(event.lat, event.lng))
    
    return (
      <div
        className="fixed z-[10000] bg-white px-3 py-2 rounded shadow-lg border border-gray-200 text-sm pointer-events-none"
        style={{
          top: mapRect.top + point.y - 12,
          left: mapRect.left + point.x,
          minWidth: '120px',
          maxWidth: '220px',
          transform: 'translate(-50%, -100%)',
        }}
      >
        <div className="font-bold">{event.title}</div>
        <div className="text-xs text-gray-600">📅 {formatDateDMY(event.event_date)}</div>
        <div className="text-xs text-gray-600">{placeDisplayText}</div>
        {formattedCharacters && (
          <div className="text-xs mt-1">
            <span className="font-semibold">{t('figures')}:</span> {formattedCharacters}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">{t('loading')}</div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full flex flex-col">
      <style jsx global>{`
        .leaflet-popup-content {
          max-height: 350px !important;
          overflow-y: auto !important;
          margin: 8px 12px !important;
        }
        .leaflet-popup-content-wrapper {
          max-width: 320px !important;
          min-width: 260px !important;
        }
        .leaflet-marker-icon {
          z-index: 1 !important;
          cursor: pointer !important;
        }
        .leaflet-marker-icon:hover {
          z-index: 1001 !important;
        }
      `}</style>
      
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
          ref={mapRef}
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
          
          {filteredEvents
            .filter(event => event.lat != null && event.lng != null)
            .map(event => {
            const eventId = String(event.id)

            return (
              <Marker
                key={eventId}
                position={[event.lat, event.lng]}
                ref={(marker) => {
                  markerRefs.current[eventId] = marker
                }}
                eventHandlers={{
                  click: () => handleMarkerClick(eventId),
                  mouseover: () => handleMarkerHover(eventId),
                  mouseout: handleMarkerLeave,
                }}
              >
                <Popup
                  key={`popup-${event.id}`}
                  autoPan={false}
                  closeOnClick={false}
                  eventHandlers={{
                    popupopen: () => {
                      if (activePopup !== eventId) setActivePopup(eventId)
                    },
                    popupclose: () => {
                      if (activePopup === eventId) setActivePopup(null)
                    },
                  }}
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <strong className="text-lg">{event.title}</strong>
                    </div>
                    <span className="text-sm text-gray-600">📅 {formatDateDMY(event.event_date)}</span>
                    {event.description && (
                      <p className="text-sm text-gray-700 mt-1">{event.description.substring(0, 150)}</p>
                    )}
                    
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                      {event.place_name ? (
                        <>
                          <strong>{event.place_type_name || 'Lugar'}:</strong> {event.place_name}
                          {event.place_previous_name && (
                            <div className="text-xs text-gray-500 mt-1">Anteriormente: {event.place_previous_name}</div>
                          )}
                        </>
                      ) : (
                        <span>{formatLocation(event.lat, event.lng)}</span>
                      )}
                    </div>
                    
                    {event.frame_id && (
                      <div className="text-xs text-gray-500 mt-1">
                        🏛️ {t('historicalFrame')}: {frames.find(f => f.id === event.frame_id)?.name || 'Desconocido'}
                      </div>
                    )}
                    
                    {event.characters && event.characters.length > 0 && (
                      <>
                        <hr className="my-2" />
                        <strong className="text-sm">{t('historicalFigures')}:</strong>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {event.characters.slice(0, 3).map((c: any, i: number) => {
                            const charName = typeof c === 'string' ? c : c.name
                            const displayName = getPopupDisplayName(charName)
                            const charDetails = getCharacterDetails(charName)
                            return (
                              <span key={i} className="bg-gray-100 px-2 py-1 rounded text-xs flex items-center gap-1">
                                {charDetails.image_url && (
                                  <OptimizedImage src={charDetails.image_url} alt={charName} className="w-4 h-4 rounded-full" />
                                )}
                                {displayName}
                              </span>
                            )
                          })}
                          {event.characters.length > 3 && (
                            <span className="text-xs text-gray-500">+ {event.characters.length - 3} más</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
        
        {/* Tooltip personalizado (hover) renderizado fuera del mapa */}
        {filteredEvents.map(event => renderCustomTooltip(event))}
      </div>

      {showEventForm && newEventLat !== null && newEventLng !== null && (
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