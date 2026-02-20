 'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { HistoricalEvent, Frame } from '../types'
import { supabase } from '@/lib/supabase'
import { fetchFrames, createFrame, upsertCharacters } from '@/lib/database'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface MapInteractionProps {
  onAddEvent: (lat: number, lng: number) => void
  events: HistoricalEvent[]
  selectedYear: number | null
}

function MapInteraction({ onAddEvent, events, selectedYear }: MapInteractionProps) {
  const map = useMap()
  const markersRef = useRef<{ [key: string]: L.Marker }>({})

  useEffect(() => {
    const mapContainer = map.getContainer() as HTMLElement

    // Prevent context menu and capture right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    // Handle right-click on mousedown
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2) { // Right mouse button only
        e.preventDefault()
        e.stopPropagation()
        
        // Get coordinates relative to map
        const rect = mapContainer.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        // Convert pixel coordinates to lat/lng
        const point = map.containerPointToLatLng(L.point(x, y))
        onAddEvent(point.lat, point.lng)
      }
    }

    // Prevent right-click context menu
    mapContainer.addEventListener('contextmenu', handleContextMenu, true)
    // Capture right-click on mouse down
    mapContainer.addEventListener('mousedown', handleMouseDown, true)

    return () => {
      mapContainer.removeEventListener('contextmenu', handleContextMenu, true)
      mapContainer.removeEventListener('mousedown', handleMouseDown, true)
    }
  }, [map, onAddEvent])

  // Add/remove markers based on selected year
  useEffect(() => {
    // Remove all markers
    Object.values(markersRef.current).forEach(marker => {
      map.removeLayer(marker)
    })
    markersRef.current = {}

    // Add markers for selected year
    if (selectedYear) {
      events
        .filter(event => {
          const eventYear = parseInt(event.event_date.split('-')[0])
          return eventYear === selectedYear && event.status === 'approved'
        })
        .forEach(event => {
          const charactersHtml = Array.isArray(event.characters)
            ? event.characters
              .map((char: any) => {
                const charObj = typeof char === 'string' ? { name: char, image_url: null } : char
                return `<div class="mb-2 text-sm">
                  <strong>${charObj.name || 'Unknown'}</strong>
                  ${charObj.image_url ? `<br/><img src="${charObj.image_url}" alt="${charObj.name}" style="max-width:100px; max-height:100px; border-radius:4px; margin-top:4px;" />` : ''}
                </div>`
              })
              .join('')
            : ''
          
          const popupContent = `
            <div style="font-size:12px;">
              <strong style="font-size:14px;">${event.title}</strong><br/>
              ${event.event_date}<br/>
              <em>${event.description}</em><br/>
              ${charactersHtml ? `<hr style="margin:4px 0;"/><strong>Historical Figures:</strong>${charactersHtml}` : ''}
            </div>
          `
          const marker = L.marker([event.lat, event.lng]).bindPopup(popupContent)
          marker.addTo(map)
          markersRef.current[event.id] = marker
        })
    }
  }, [selectedYear, events, map])

  return null
}

export default function Map() {
  const [events, setEvents] = useState<HistoricalEvent[]>([])
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentProfile, setCurrentProfile] = useState<any>(null)
  const [years, setYears] = useState<number[]>([])
  const [frames, setFrames] = useState<Frame[]>([])
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null)
  const [newFrameName, setNewFrameName] = useState('')
  const [newFrameDescription, setNewFrameDescription] = useState('')
  const [characterList, setCharacterList] = useState<Array<{ name: string; description: string; image_url: string }>>([])
  const [newCharacterName, setNewCharacterName] = useState('')
  const [newCharacterDescription, setNewCharacterDescription] = useState('')
  const [newCharacterImageUrl, setNewCharacterImageUrl] = useState('')
  const [formData, setFormData] = useState({
    lat: 0,
    lng: 0,
    title: '',
    description: '',
    date: ''
  })

  // Load current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
      if (user) {
        // fetch profile to get role
        const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
        if (profile) setCurrentProfile(profile)
      }
    }
    getUser()
  }, [])

  // Fetch events from Supabase
  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'approved')
      
      if (error) {
        console.error('Error fetching events:', error)
      } else {
        setEvents(data || [])
      }
    }

    fetchEvents()

    // fetch frames for selector
    const loadFrames = async () => {
      const f = await fetchFrames()
      setFrames(f)
    }
    loadFrames()

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
    const uniqueYears = [
      ...new Set(
        events
          .filter(e => e.status === 'approved')
          .map(e => parseInt(e.event_date.split('-')[0]))
      ),
    ].sort((a, b) => a - b)
    setYears(uniqueYears)
    
    // Auto-select first year
    if (uniqueYears.length > 0 && selectedYear === null) {
      setSelectedYear(uniqueYears[0])
    }
  }, [events, selectedYear])

  const handleAddEvent = (lat: number, lng: number) => {
    if (!currentUser) {
      alert('Please log in to add events')
      return
    }
    setFormData({ ...formData, lat, lng })
    setCharacterList([])
    setNewCharacterName('')
    setNewCharacterDescription('')
    setNewCharacterImageUrl('')
    setShowAddForm(true)
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.date) {
      alert('Please fill in all fields')
      return
    }

    try {
      // Upsert user (create or update)
      const { error: userError } = await supabase.from('users').upsert(
        [
          {
            id: currentUser.id,
            email: currentUser.email,
            full_name: currentUser.email.split('@')[0],
            role: 'regular'
          }
        ],
        { onConflict: 'id' }
      )

      if (userError) {
        console.error('Error creating user:', userError)
        alert('Error: ' + userError.message)
        return
      }

      // Upsert characters if any were added
      if (characterList.length > 0) {
        await upsertCharacters(characterList)
      }

      // Now insert the event (include optional frame_id)
      const isSuper = currentProfile?.role === 'super_user'
      const { error } = await supabase.from('events').insert([
        {
          user_id: currentUser.id,
          lat: formData.lat,
          lng: formData.lng,
          title: formData.title,
          description: formData.description,
          event_date: formData.date,
          characters: characterList,
          status: isSuper ? 'approved' : 'pending',
          frame_id: selectedFrameId || null
        }
      ])

      if (error) {
        console.error('Error adding event:', error)
        alert('Error adding event: ' + error.message)
      } else {
        alert('Event added! Waiting for super user approval.')
        setShowAddForm(false)
        setFormData({
          lat: 0,
          lng: 0,
          title: '',
          description: '',
          date: ''
        })
        setCharacterList([])
        // Refresh events
        const { data } = await supabase
          .from('events')
          .select('*')
          .eq('status', 'approved')
        if (data) setEvents(data)
      }
    } catch (e) {
      console.error('Unexpected error:', e)
      alert('Unexpected error: ' + (e as Error).message)
    }
  }

  const handleCreateFrame = async () => {
    if (!newFrameName) return alert('Frame name required')
    try {
      const created = await createFrame({ name: newFrameName, description: newFrameDescription || undefined })
      if (created) {
        setFrames(prev => [created, ...prev])
        setSelectedFrameId(created.id)
        setNewFrameName('')
        setNewFrameDescription('')
      }
    } catch (err) {
      console.error('Error creating frame:', err)
      alert('Error creating frame')
    }
  }

  const handleAddCharacter = () => {
    if (!newCharacterName.trim()) {
      alert('Character name required')
      return
    }
    const newChar = {
      name: newCharacterName.trim(),
      description: newCharacterDescription.trim(),
      image_url: newCharacterImageUrl.trim()
    }
    setCharacterList(prev => [...prev, newChar])
    setNewCharacterName('')
    setNewCharacterDescription('')
    setNewCharacterImageUrl('')
  }

  const handleRemoveCharacter = (index: number) => {
    setCharacterList(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Timeline Bar */}
      <div className="bg-gray-800 text-white p-4 overflow-x-auto">
        <div className="flex gap-2 items-center">
          <span className="whitespace-nowrap font-semibold">Timeline:</span>
          <div className="flex gap-2">
            {years.length === 0 ? (
              <p className="text-gray-400">No events yet</p>
            ) : (
              years.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-4 py-2 rounded whitespace-nowrap transition-colors ${
                    selectedYear === year
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                >
                  {year}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Info Bar */}
      <div className="bg-blue-100 text-blue-900 p-2 text-sm">
        💡 Right-click on the map to add a historical event
        {!currentUser && ' | Please log in to add events'}
      </div>

      {/* Map */}
      <div className="flex-1">
        <MapContainer center={[0, 0]} zoom={2} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapInteraction 
            onAddEvent={handleAddEvent} 
            events={events} 
            selectedYear={selectedYear}
          />
        </MapContainer>
      </div>

      {/* Add Event Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 9999 }}>
          <div className="bg-white p-6 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto" style={{ zIndex: 10000 }}>
            <h2 className="text-2xl font-bold mb-4">Add Historical Event</h2>
            
            <input
              type="text"
              placeholder="Event Title"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2 border rounded mb-3"
            />

            <input
              type="date"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              className="w-full p-2 border rounded mb-3"
            />

            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border rounded mb-3 resize-none"
              rows={3}
            />

            {/* Historical Figures / Characters Section */}
            <div className="mb-3 p-2 border rounded bg-blue-50">
              <label className="block text-sm font-bold mb-2">Historical Figures</label>
              
              <input
                type="text"
                placeholder="Name"
                value={newCharacterName}
                onChange={e => setNewCharacterName(e.target.value)}
                className="w-full p-2 border rounded mb-2 text-sm"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newCharacterDescription}
                onChange={e => setNewCharacterDescription(e.target.value)}
                className="w-full p-2 border rounded mb-2 text-sm"
              />
              <input
                type="url"
                placeholder="Image URL (optional)"
                value={newCharacterImageUrl}
                onChange={e => setNewCharacterImageUrl(e.target.value)}
                className="w-full p-2 border rounded mb-2 text-sm"
              />
              <button
                onClick={handleAddCharacter}
                className="w-full bg-blue-500 text-white p-2 rounded text-sm hover:bg-blue-600 font-semibold"
              >
                Add Figure
              </button>

              {/* List of added characters */}
              {characterList.length > 0 && (
                <div className="mt-3 max-h-32 overflow-y-auto">
                  {characterList.map((char, idx) => (
                    <div key={idx} className="flex justify-between items-start bg-white p-2 rounded mb-1 text-xs">
                      <div className="flex-1">
                        <strong>{char.name}</strong>
                        {char.description && <div className="text-gray-600">{char.description}</div>}
                        {char.image_url && <div className="text-blue-600 truncate">{char.image_url}</div>}
                      </div>
                      <button
                        onClick={() => handleRemoveCharacter(idx)}
                        className="ml-2 text-red-600 hover:text-red-800 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Frame selector */}
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Frame</label>
              <select
                value={selectedFrameId || ''}
                onChange={e => setSelectedFrameId(e.target.value || null)}
                className="w-full p-2 border rounded"
              >
                <option value="">(No frame)</option>
                {frames.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            {/* Create frame - only visible to super users */}
            {currentProfile?.role === 'super_user' && (
              <div className="mb-3 p-2 border rounded bg-gray-50">
                <label className="block text-sm font-medium mb-1">Create new frame (super users)</label>
                <input
                  type="text"
                  placeholder="Frame name"
                  value={newFrameName}
                  onChange={e => setNewFrameName(e.target.value)}
                  className="w-full p-2 border rounded mb-2"
                />
                <input
                  type="text"
                  placeholder="Short description"
                  value={newFrameDescription}
                  onChange={e => setNewFrameDescription(e.target.value)}
                  className="w-full p-2 border rounded mb-2"
                />
                <div className="flex gap-2">
                  <button onClick={handleCreateFrame} className="flex-1 bg-green-600 text-white p-2 rounded">Create Frame</button>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-600 mb-4 bg-gray-100 p-2 rounded">
              📍 Location: {formData.lat.toFixed(4)}, {formData.lng.toFixed(4)}
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 font-semibold"
              >
                Submit for Approval
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}