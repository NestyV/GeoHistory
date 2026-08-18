'use client'

import { FormEvent, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import { t } from '@/app/lib/i18n'
import { useEffect } from 'react'

interface FrameOption {
  id: string
  name: string
}

interface EventFormProps {
  lat: number
  lng: number
  frames: FrameOption[]
  onClose: () => void
  onSuccess: () => void
  onFrameCreated?: () => Promise<void> | void
}

export default function EventForm({ lat, lng, frames, onClose, onSuccess }: EventFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [frameId, setFrameId] = useState('')
  const [eventLat, setEventLat] = useState(String(lat))
  const [eventLng, setEventLng] = useState(String(lng))
  const [allCharacters, setAllCharacters] = useState<any[]>([])
  const [selectedCharacters, setSelectedCharacters] = useState<any[]>([])
  const [placeTypes, setPlaceTypes] = useState<any[]>([])
  const [places, setPlaces] = useState<any[]>([])
  const [selectedPlaceTypeId, setSelectedPlaceTypeId] = useState('')
  const [selectedPlaceId, setSelectedPlaceId] = useState('')
  const [showNewCharacterForm, setShowNewCharacterForm] = useState(false)
  const [newCharacterName, setNewCharacterName] = useState('')
  const [newCharacterDesc, setNewCharacterDesc] = useState('')
  const [newCharacterImageUrl, setNewCharacterImageUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [charactersData, placeTypesData, placesData] = await Promise.all([
          typeof api.getCharacters === 'function' ? api.getCharacters() : Promise.resolve([]),
          typeof api.getPlaceTypes === 'function' ? api.getPlaceTypes() : Promise.resolve([]),
          typeof api.getPlaces === 'function' ? api.getPlaces() : Promise.resolve([]),
        ])

        setAllCharacters(charactersData || [])
        setPlaceTypes(placeTypesData || [])
        setPlaces(placesData || [])
      } catch (error) {
        console.error('Error loading event form lookup data:', error)
      }
    }

    loadLookups()
  }, [])

  const canSubmit = useMemo(() => {
    return title.trim().length > 0 && eventDate.trim().length > 0 && !submitting
  }, [title, eventDate, submitting])

  const filteredPlaces = useMemo(() => {
    if (!selectedPlaceTypeId) return places
    return places.filter((place: any) => place.place_type_id === selectedPlaceTypeId)
  }, [places, selectedPlaceTypeId])

  const getPlaceLat = (place: any): number | null => {
    const value = place?.lat ?? place?.latitude
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  const getPlaceLng = (place: any): number | null => {
    const value = place?.lng ?? place?.longitude
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  const getPlaceName = (place: any) => place?.current_name || place?.name || ''

  const handleAddCharacter = (character: any) => {
    if (!selectedCharacters.find((c: any) => c.id === character.id)) {
      setSelectedCharacters((prev) => [...prev, character])
    }
  }

  const handleRemoveCharacter = (characterId: string) => {
    setSelectedCharacters((prev) => prev.filter((c: any) => c.id !== characterId))
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

      const createdCharacter = result.character || result
      setAllCharacters((prev) => [...prev, createdCharacter])
      setSelectedCharacters((prev) => [...prev, createdCharacter])
      setNewCharacterName('')
      setNewCharacterDesc('')
      setNewCharacterImageUrl('')
      setShowNewCharacterForm(false)
    } catch (error: any) {
      setErrorMessage(error?.message || t('errorOccurred'))
    }
  }

  const handlePlaceSelect = (placeId: string) => {
    setSelectedPlaceId(placeId)
    const selectedPlace = places.find((place: any) => place.id === placeId)
    if (!selectedPlace) return

    const placeLat = getPlaceLat(selectedPlace)
    const placeLng = getPlaceLng(selectedPlace)

    if (placeLat != null && placeLng != null) {
      setEventLat(String(placeLat))
      setEventLng(String(placeLng))
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) {
      return
    }

    setSubmitting(true)
    setErrorMessage('')

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      event_date: eventDate,
      frame_id: frameId || null,
      lat: Number(eventLat),
      lng: Number(eventLng),
      characters: selectedCharacters.map((character: any) => ({
        id: character.id,
        name: character.name,
      })),
    }

    try {
      await api.createEvent(payload)
      onSuccess()
    } catch (error: any) {
      setErrorMessage(error?.message || t('errorOccurred'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[10001] bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{t('addEvent')}</h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="close-event-form">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="event-title" className="block text-sm font-medium text-gray-700 mb-1">
              {t('title')}
            </label>
            <input
              id="event-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2"
              required
            />
          </div>

          <div>
            <label htmlFor="event-date" className="block text-sm font-medium text-gray-700 mb-1">
              {t('date')}
            </label>
            <input
              id="event-date"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2"
              required
            />
          </div>

          <div>
            <label htmlFor="event-description" className="block text-sm font-medium text-gray-700 mb-1">
              {t('description')}
            </label>
            <textarea
              id="event-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2"
              rows={4}
            />
          </div>

          <div>
            <label htmlFor="event-frame" className="block text-sm font-medium text-gray-700 mb-1">
              {t('historicalFrame')}
            </label>
            <select
              id="event-frame"
              value={frameId}
              onChange={(e) => setFrameId(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2"
            >
              <option value="">{t('allFrames')}</option>
              {frames.map((frame) => (
                <option key={frame.id} value={frame.id}>
                  {frame.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="event-place-type" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de lugar
            </label>
            <select
              id="event-place-type"
              value={selectedPlaceTypeId}
              onChange={(e) => {
                setSelectedPlaceTypeId(e.target.value)
                setSelectedPlaceId('')
              }}
              className="w-full rounded border border-gray-300 px-3 py-2"
            >
              <option value="">Todos los tipos</option>
              {placeTypes.map((type: any) => (
                <option key={type.id} value={type.id}>
                  {type.icon || '📍'} {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="event-place" className="block text-sm font-medium text-gray-700 mb-1">
              Lugar (opcional)
            </label>
            <select
              id="event-place"
              value={selectedPlaceId}
              onChange={(e) => handlePlaceSelect(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2"
            >
              <option value="">Seleccionar lugar</option>
              {filteredPlaces.map((place: any) => (
                <option key={place.id} value={place.id}>
                  {getPlaceName(place)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="event-lat" className="block text-sm font-medium text-gray-700 mb-1">
                Latitud
              </label>
              <input
                id="event-lat"
                type="number"
                step="any"
                value={eventLat}
                onChange={(e) => setEventLat(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2"
                required
              />
            </div>
            <div>
              <label htmlFor="event-lng" className="block text-sm font-medium text-gray-700 mb-1">
                Longitud
              </label>
              <input
                id="event-lng"
                type="number"
                step="any"
                value={eventLng}
                onChange={(e) => setEventLng(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('historicalFigures')}</label>

            {selectedCharacters.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedCharacters.map((character: any) => (
                  <span key={character.id} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs flex items-center gap-1">
                    {character.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveCharacter(character.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <select
              onChange={(e) => {
                const character = allCharacters.find((item: any) => item.id === e.target.value)
                if (character) handleAddCharacter(character)
                e.target.value = ''
              }}
              className="w-full rounded border border-gray-300 px-3 py-2"
              value=""
            >
              <option value="">{t('addCharacter')}</option>
              {allCharacters
                .filter((character: any) => !selectedCharacters.find((item: any) => item.id === character.id))
                .map((character: any) => (
                  <option key={character.id} value={character.id}>
                    {character.name}
                  </option>
                ))}
            </select>

            {!showNewCharacterForm ? (
              <button
                type="button"
                onClick={() => setShowNewCharacterForm(true)}
                className="text-blue-600 hover:text-blue-800 text-sm mt-2"
              >
                + {t('addNewCharacter')}
              </button>
            ) : (
              <div className="border rounded p-3 mt-2 space-y-2 bg-gray-50">
                <input
                  type="text"
                  placeholder={t('characterName')}
                  value={newCharacterName}
                  onChange={(e) => setNewCharacterName(e.target.value)}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                />
                <textarea
                  placeholder={t('description')}
                  value={newCharacterDesc}
                  onChange={(e) => setNewCharacterDesc(e.target.value)}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                  rows={2}
                />
                <input
                  type="url"
                  placeholder={t('imageUrl')}
                  value={newCharacterImageUrl}
                  onChange={(e) => setNewCharacterImageUrl(e.target.value)}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
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

          <div className="text-xs text-gray-500">
            {t('location')}: {Number(eventLat).toFixed(4)}, {Number(eventLng).toFixed(4)}
          </div>

          {errorMessage && <div className="text-sm text-red-600">{errorMessage}</div>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200">
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              disabled={!canSubmit}
            >
              {submitting ? t('loading') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
