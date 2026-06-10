'use client'

import { useState, useEffect } from 'react'
import { api, auth } from '@/lib/api'

interface EventFormProps {
  lat: number
  lng: number
  onClose: () => void
  onSuccess: () => void
  frames: any[]
  onFrameCreated?: () => void
}

export default function EventForm({ lat, lng, onClose, onSuccess, frames, onFrameCreated }: EventFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [selectedFrameId, setSelectedFrameId] = useState('')
  const [characters, setCharacters] = useState<any[]>([])
  const [allCharacters, setAllCharacters] = useState<any[]>([])
  const [newCharacterName, setNewCharacterName] = useState('')
  const [newCharacterDesc, setNewCharacterDesc] = useState('')
  const [newCharacterImageUrl, setNewCharacterImageUrl] = useState('')
  const [showNewCharacterForm, setShowNewCharacterForm] = useState(false)
  const [showNewFrameForm, setShowNewFrameForm] = useState(false)
  const [newFrameName, setNewFrameName] = useState('')
  const [newFrameDescription, setNewFrameDescription] = useState('')
  const [newFrameStartDate, setNewFrameStartDate] = useState('')
  const [newFrameEndDate, setNewFrameEndDate] = useState('')
  const [creatingFrame, setCreatingFrame] = useState(false)
  const [loading, setLoading] = useState(false)
  const currentUser = auth.getUser()

  useEffect(() => {
    const loadCharacters = async () => {
      try {
        const chars = await api.getCharacters()
        setAllCharacters(chars || [])
      } catch (error) {
        console.error('Error loading characters:', error)
      }
    }
    loadCharacters()
  }, [])

  const handleAddCharacter = (character: any) => {
    if (!characters.find(c => c.id === character.id)) {
      setCharacters([...characters, character])
    }
  }

  const handleRemoveCharacter = (characterId: string) => {
    setCharacters(characters.filter(c => c.id !== characterId))
  }

  const handleCreateNewCharacter = async () => {
    if (!newCharacterName.trim()) return
    
    try {
      const result = await api.createCharacter(newCharacterName, newCharacterDesc, newCharacterImageUrl || null)
      const newChar = result.character || result
      setAllCharacters([...allCharacters, newChar])
      setCharacters([...characters, newChar])
      setNewCharacterName('')
      setNewCharacterDesc('')
      setNewCharacterImageUrl('')
      setShowNewCharacterForm(false)
    } catch (error) {
      console.error('Error creating character:', error)
      alert('Error creating character')
    }
  }

  const handleCreateNewFrame = async () => {
    if (!newFrameName.trim()) {
      alert('Please enter a frame name')
      return
    }

    setCreatingFrame(true)
    try {
      const result = await api.createFrame(
        newFrameName,
        newFrameDescription || null,
        newFrameStartDate || null,
        newFrameEndDate || null
      )
      
      const newFrame = result.frame || result
      setSelectedFrameId(newFrame.id)
      setShowNewFrameForm(false)
      setNewFrameName('')
      setNewFrameDescription('')
      setNewFrameStartDate('')
      setNewFrameEndDate('')
      
      if (onFrameCreated) {
        onFrameCreated()
      }
      
      alert(`Frame "${newFrameName}" created successfully!`)
    } catch (error: any) {
      console.error('Error creating frame:', error)
      alert('Error creating frame: ' + error.message)
    } finally {
      setCreatingFrame(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) {
      alert('Please login to add events')
      return
    }

    setLoading(true)
    try {
      await api.createEvent({
        lat,
        lng,
        title,
        description,
        event_date: eventDate,
        frame_id: selectedFrameId || null,
        characters: characters.map(c => ({ name: c.name, id: c.id })),
        user_id: currentUser.id,
      })
      
      alert('Event submitted for approval! Admin will review it soon.')
      onSuccess()
      onClose()
    } catch (error: any) {
      alert('Error creating event: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Add Historical Event</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full p-2 border rounded"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Date *</label>
            <input
              type="date"
              value={eventDate}
              onChange={e => setEventDate(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Historical Frame</label>
            
            {!showNewFrameForm ? (
              <>
                <select
                  value={selectedFrameId}
                  onChange={e => setSelectedFrameId(e.target.value)}
                  className="w-full p-2 border rounded mb-2"
                >
                  <option value="">Select a historical period...</option>
                  {frames.map(frame => (
                    <option key={frame.id} value={frame.id}>
                      {frame.name} 
                      {frame.start_date && frame.end_date && 
                        ` (${frame.start_date.split('-')[0]} - ${frame.end_date.split('-')[0]})`
                      }
                    </option>
                  ))}
                </select>
                
                <button
                  type="button"
                  onClick={() => setShowNewFrameForm(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add a new historical frame not in the list
                </button>
              </>
            ) : (
              <div className="border rounded p-3 space-y-2 bg-gray-50">
                <h4 className="font-semibold text-sm">Create New Historical Frame</h4>
                
                <input
                  type="text"
                  placeholder="Frame name * (e.g., 'World War I', 'Renaissance')"
                  value={newFrameName}
                  onChange={e => setNewFrameName(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                  required
                />
                
                <textarea
                  placeholder="Description (optional)"
                  value={newFrameDescription}
                  onChange={e => setNewFrameDescription(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                  rows={2}
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    placeholder="Start date"
                    value={newFrameStartDate}
                    onChange={e => setNewFrameStartDate(e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                  />
                  <input
                    type="date"
                    placeholder="End date"
                    value={newFrameEndDate}
                    onChange={e => setNewFrameEndDate(e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                  />
                </div>
                
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCreateNewFrame}
                    disabled={creatingFrame || !newFrameName.trim()}
                    className="flex-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {creatingFrame ? 'Creating...' : 'Create Frame'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewFrameForm(false)
                      setNewFrameName('')
                      setNewFrameDescription('')
                      setNewFrameStartDate('')
                      setNewFrameEndDate('')
                    }}
                    className="flex-1 bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Historical Figures</label>
            <div className="space-y-2">
              {characters.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {characters.map(char => (
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
                <option value="">Add a historical figure...</option>
                {allCharacters
                  .filter(char => !characters.find(c => c.id === char.id))
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
                  + Add a character not in the list
                </button>
              ) : (
                <div className="border rounded p-3 space-y-2 bg-gray-50">
                  <input
                    type="text"
                    placeholder="Character name *"
                    value={newCharacterName}
                    onChange={e => setNewCharacterName(e.target.value)}
                    className="w-full p-1 border rounded text-sm"
                  />
                  <textarea
                    placeholder="Brief description"
                    value={newCharacterDesc}
                    onChange={e => setNewCharacterDesc(e.target.value)}
                    className="w-full p-1 border rounded text-sm"
                    rows={2}
                  />
                  <input
                    type="url"
                    placeholder="Image URL (optional)"
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
                      Save Character
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
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-600">
            📍 Location: {lat.toFixed(4)}, {lng.toFixed(4)}
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Submitting...' : 'Submit for Review'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
