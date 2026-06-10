'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { api } from '@/lib/api'
import Navbar from '../components/Navbar'
import OptimizedImage from '../components/OptimizedImage'
import { t } from '@/app/lib/i18n'

// Función para formatear fecha sin conversión de zona horaria
const formatDateDisplay = (dateString: string) => {
  if (!dateString) return ''
  const [year, month, day] = dateString.split('T')[0].split('-')
  return `${day}/${month}/${year}`
}

export default function TimelineContent() {
  const [events, setEvents] = useState<any[]>([])
  const [frames, setFrames] = useState<any[]>([])
  const [characters, setCharacters] = useState<any[]>([])
  const [filteredEvents, setFilteredEvents] = useState<any[]>([])
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [years, setYears] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [userSelectedYear, setUserSelectedYear] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const isMounted = useRef(true)

  useEffect(() => {
    setIsClient(true)
  }, [])

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
        setCharacters(charactersData || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      if (isMounted.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    isMounted.current = true
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => {
      isMounted.current = false
      clearInterval(interval)
    }
  }, [fetchData])

  // Actualizar años según el marco seleccionado
  useEffect(() => {
    if (!events.length) return
    
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

  // Filtrar eventos por marco y año, y ordenar por fecha
  useEffect(() => {
    let filtered = events.filter(e => e.status === 'approved')
    
    if (selectedFrameId) {
      filtered = filtered.filter(e => e.frame_id === selectedFrameId)
    }
    
    if (selectedYear) {
      filtered = filtered.filter(e => {
        const eventYear = new Date(e.event_date).getFullYear()
        return eventYear === selectedYear
      })
    }
    
    filtered.sort((a, b) => {
      const dateA = new Date(a.event_date).getTime()
      const dateB = new Date(b.event_date).getTime()
      return dateA - dateB
    })
    
    setFilteredEvents(filtered)
  }, [events, selectedFrameId, selectedYear])

  const handleFrameSelect = (frameId: string | null) => {
    setSelectedFrameId(frameId)
  }

  const handleYearSelect = (year: number | null) => {
    setUserSelectedYear(true)
    setSelectedYear(year)
  }

  const getCharacterImage = (characterName: string) => {
    const character = characters.find(c => c.name === characterName)
    return character?.image_url
  }

  if (!isClient) {
    return null
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="p-8 max-w-4xl mx-auto">
          <div className="text-center py-8">{t('loading')}</div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="p-8 max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">{t('historicalTimeline')}</h1>

        {/* Selector de Marcos Históricos */}
        {frames.length > 0 && (
          <div className="bg-white border-b border-gray-200 shadow-sm mb-4">
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

        {/* Selector de Años */}
        {years.length > 0 ? (
          <div className="mb-8 overflow-x-auto">
            <div className="flex gap-2 pb-4">
              {years.map(year => (
                <button
                  key={year}
                  onClick={() => handleYearSelect(year)}
                  className={`px-4 py-2 rounded whitespace-nowrap transition-all ${
                    selectedYear === year
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  {year}
                </button>
              ))}
              <button
                onClick={() => handleYearSelect(null)}
                className={`px-4 py-2 rounded whitespace-nowrap transition-all ${
                  selectedYear === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                  }`}
              >
                {t('allYearsBtn')}
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-8 text-center text-gray-500">
            {t('noEventsYet')}
          </div>
        )}

        {/* Lista de Eventos */}
        <div className="space-y-4">
          {filteredEvents.length === 0 && selectedYear ? (
            <div className="text-center py-8 text-gray-500">
              {t('noEventsForYear').replace('{year}', selectedYear.toString())}
            </div>
          ) : (
            filteredEvents.map(event => (
              <div key={event.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition">
                <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                <p className="text-gray-600 mb-2">{event.description}</p>
                <p className="text-sm text-gray-500">📅 {formatDateDisplay(event.event_date)}</p>
                <p className="text-sm text-gray-500">📍 {event.lat.toFixed(4)}, {event.lng.toFixed(4)}</p>
                {event.characters && Array.isArray(event.characters) && event.characters.length > 0 && (
                  <div className="mt-2">
                    <strong>{t('historicalFigures')}:</strong>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {event.characters.map((char: any, idx: number) => {
                        const charName = typeof char === 'string' ? char : char.name
                        const charImage = getCharacterImage(charName)
                        return (
                          <div key={idx} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-sm">
                            {charImage && (
                              <OptimizedImage 
                                src={charImage} 
                                alt={charName} 
                                className="w-5 h-5 rounded-full object-cover"
                              />
                            )}
                            <span>{charName}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </>
  )
}
