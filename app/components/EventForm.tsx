'use client'

import { FormEvent, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import { t } from '@/app/lib/i18n'

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
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const canSubmit = useMemo(() => {
    return title.trim().length > 0 && eventDate.trim().length > 0 && !submitting
  }, [title, eventDate, submitting])

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
      lat,
      lng,
      characters: [],
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

          <div className="text-xs text-gray-500">
            {t('location')}: {lat.toFixed(4)}, {lng.toFixed(4)}
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
