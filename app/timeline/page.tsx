'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { HistoricalEvent } from '../types'
import Navbar from '../components/Navbar'

export default function TimelinePage() {
  const [events, setEvents] = useState<HistoricalEvent[]>([])
  const [filteredEvents, setFilteredEvents] = useState<HistoricalEvent[]>([])
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [years, setYears] = useState<number[]>([])

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'approved')
        .order('event_date', { ascending: true })
      
      if (error) {
        console.error('Error fetching events:', error)
      } else {
        setEvents(data || [])
      }
    }

    fetchEvents()

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        fetchEvents()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    // Extract unique years
    const uniqueYears = [
      ...new Set(
        events.map(e => parseInt(e.event_date.split('-')[0]))
      ),
    ].sort((a, b) => a - b)
    setYears(uniqueYears)

    // Auto-select first year
    if (uniqueYears.length > 0 && selectedYear === null) {
      setSelectedYear(uniqueYears[0])
    }
  }, [events])

  useEffect(() => {
    if (selectedYear) {
      const filtered = events.filter(e => {
        const eventYear = parseInt(e.event_date.split('-')[0])
        return eventYear === selectedYear
      })
      setFilteredEvents(filtered)
    }
  }, [selectedYear, events])

  return (
    <>
      <Navbar />
      <main className="p-8 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Historical Timeline</h1>

        {/* Year Navigation */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex gap-2 pb-4">
            {years.map(year => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-4 py-2 rounded whitespace-nowrap transition-colors ${
                  selectedYear === year
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        {/* Events */}
        {filteredEvents.length === 0 ? (
          <p className="text-gray-600 text-lg">No events found for this year</p>
        ) : (
          <div className="space-y-6">
            {filteredEvents.map((event, index) => (
              <div
                key={event.id}
                className="border-l-4 border-blue-600 pl-6 pb-6"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 mt-1">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">{event.title}</h2>
                    <p className="text-gray-600 text-sm mb-2">
                      📅 {new Date(event.event_date).toLocaleDateString()} | 📍 {event.lat.toFixed(2)}, {event.lng.toFixed(2)}
                    </p>
                    <p className="text-gray-700 mb-3">{event.description}</p>
                    {event.characters && event.characters.length > 0 && (
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="font-semibold text-sm text-gray-700">
                          👥 Key Figures: {Array.isArray(event.characters) ? event.characters.join(', ') : event.characters}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}