'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, auth } from '@/lib/api'
import Navbar from '@/app/components/layout/Navbar'
import AdminNav from '@/app/components/layout/AdminNav'
import OptimizedImage from '@/app/components/common/OptimizedImage'
import { useRouter } from 'next/navigation'
import { t } from '@/app/lib/i18n'

export default function CharactersPage() {
  const [characters, setCharacters] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [frames, setFrames] = useState<any[]>([])
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingCharacter, setEditingCharacter] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [imagePreview, setImagePreview] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    alias: '',
    description: '',
    image_url: '',
    frame_ids: [] as string[],
    face_crop_x: 50,
    face_crop_y: 40,
    face_crop_scale: 1,
    face_crop_size: 55,
  })
  const router = useRouter()
  
  const currentUser = auth.getUser()
  const isAtLeastCurator = currentUser?.role === 'curator' || currentUser?.role === 'super_user'

  const loadCharacterIndex = useCallback(async () => {
    try {
      const [charactersData, framesData, eventsData] = await Promise.all([
        api.getCharacters(),
        api.getFrames(),
        api.getEvents(),
      ])

      setCharacters(charactersData || [])
      setFrames(framesData || [])
      setEvents(eventsData || [])
    } catch (error) {
      console.error('Error fetching character index:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAtLeastCurator) {
      router.push('/map')
      return
    }
    loadCharacterIndex()
  }, [router, isAtLeastCurator, loadCharacterIndex])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        alert('No hay token de autenticación. Por favor, inicia sesión nuevamente.')
        return
      }
      
      const selectedFrameIds = Array.from(new Set(formData.frame_ids))
      const payload = {
        name: formData.name,
        alias: formData.alias || null,
        description: formData.description || null,
        image_url: formData.image_url || null,
        frame_ids: selectedFrameIds,
        frame_id: selectedFrameIds[0] || null,
        face_crop_x: formData.face_crop_x,
        face_crop_y: formData.face_crop_y,
        face_crop_scale: formData.face_crop_scale,
        face_crop_size: formData.face_crop_size,
      }
      
      const url = editingCharacter 
        ? `http://localhost:3001/api/characters/${editingCharacter.id}`
        : 'http://localhost:3001/api/characters'
      
      const response = await fetch(url, {
        method: editingCharacter ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Error al guardar')
        return
      }
      
      setShowForm(false)
      setEditingCharacter(null)
      setFormData({
        name: '',
        alias: '',
        description: '',
        image_url: '',
        frame_ids: [],
        face_crop_x: 50,
        face_crop_y: 40,
        face_crop_scale: 1,
        face_crop_size: 55,
      })
      setImagePreview('')
      loadCharacterIndex()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este personaje?')) return
    
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        alert('No hay token de autenticación. Por favor, inicia sesión nuevamente.')
        return
      }
      
      const response = await fetch(`http://localhost:3001/api/characters/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Error al eliminar')
        return
      }
      
      loadCharacterIndex()
    } catch (error) {
      console.error('Error deleting character:', error)
      alert('Error al eliminar el personaje')
    }
  }

  const handleEdit = (character: any) => {
    setEditingCharacter(character)
    const characterFrameIds = Array.isArray(character?.frame_ids) && character.frame_ids.length > 0
      ? character.frame_ids
      : character?.frame_id
        ? [character.frame_id]
        : []
    setFormData({
      name: character.name,
      alias: character.alias || '',
      description: character.description || '',
      image_url: character.image_url || '',
      frame_ids: characterFrameIds,
      face_crop_x: typeof character.face_crop_x === 'number' ? character.face_crop_x : 50,
      face_crop_y: typeof character.face_crop_y === 'number' ? character.face_crop_y : 40,
      face_crop_scale: typeof character.face_crop_scale === 'number' ? character.face_crop_scale : 1,
      face_crop_size: typeof character.face_crop_size === 'number' ? character.face_crop_size : 55,
    })
    setImagePreview(character.image_url || '')
    setShowForm(true)
  }

  const handleImageUrlChange = (url: string) => {
    setFormData({ ...formData, image_url: url })
    setImagePreview(url)
  }

  const toggleFrame = (frameId: string) => {
    setFormData((previous) => {
      const isSelected = previous.frame_ids.includes(frameId)
      return {
        ...previous,
        frame_ids: isSelected
          ? previous.frame_ids.filter((selectedFrameId) => selectedFrameId !== frameId)
          : [...previous.frame_ids, frameId],
      }
    })
  }

  const getCharacterFrameIds = (character: any): string[] => {
    if (Array.isArray(character?.frame_ids) && character.frame_ids.length > 0) {
      return character.frame_ids.filter((frameId: unknown): frameId is string => typeof frameId === 'string' && frameId.trim().length > 0)
    }

    if (typeof character?.frame_id === 'string' && character.frame_id.trim().length > 0) {
      return [character.frame_id]
    }

    return []
  }

  const frameNameById = useMemo(() => {
    const mapping = new Map<string, string>()
    frames.forEach((frame) => {
      if (frame?.id && frame?.name) {
        mapping.set(String(frame.id), String(frame.name))
      }
    })
    return mapping
  }, [frames])

  const characterFrameIndex = useMemo(() => {
    const mapping = new Map<string, Set<string>>()

    const addCharacterFrame = (rawName: unknown, frameId: unknown) => {
      if (typeof rawName !== 'string') return
      const normalizedName = rawName.trim().toLowerCase()
      if (!normalizedName) return

      const normalizedFrameId = typeof frameId === 'string' && frameId.trim().length > 0
        ? frameId
        : '__unframed__'

      if (!mapping.has(normalizedName)) {
        mapping.set(normalizedName, new Set<string>())
      }
      mapping.get(normalizedName)?.add(normalizedFrameId)
    }

    // Primary source: direct frame assignment on character record.
    characters.forEach((character) => {
      const key = String(character?.name || '').trim().toLowerCase()
      if (!key) return
      const frameIds = getCharacterFrameIds(character)
      if (frameIds.length === 0) {
        addCharacterFrame(character?.name, null)
        return
      }
      frameIds.forEach((frameId) => addCharacterFrame(character?.name, frameId))
    })

    // Fallback source: infer from linked events for legacy records.
    events.forEach((event) => {
      const eventCharacters = Array.isArray(event?.characters) ? event.characters : []
      eventCharacters.forEach((character: any) => {
        if (typeof character === 'string') {
          addCharacterFrame(character, event?.frame_id)
          return
        }
        addCharacterFrame(character?.name, event?.frame_id)
      })
    })

    return mapping
  }, [characters, events])

  const sortedCharacters = useMemo(
    () => [...characters].sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''))),
    [characters],
  )

  const filteredCharacters = useMemo(() => {
    if (!selectedFrameId) {
      return sortedCharacters
    }

    return sortedCharacters.filter((character) => {
      const key = String(character?.name || '').trim().toLowerCase()
      if (!key) return false
      return characterFrameIndex.get(key)?.has(selectedFrameId) || false
    })
  }, [selectedFrameId, sortedCharacters, characterFrameIndex])

  const frameSections = useMemo(() => {
    if (selectedFrameId) {
      const sectionTitle = frameNameById.get(selectedFrameId) || 'Marco desconocido'
      return [{ id: selectedFrameId, title: sectionTitle, items: filteredCharacters }]
    }

    const sections = frames.map((frame) => {
      const frameId = String(frame?.id || '')
      const frameItems = sortedCharacters.filter((character) => {
        const key = String(character?.name || '').trim().toLowerCase()
        return key ? characterFrameIndex.get(key)?.has(frameId) : false
      })
      return {
        id: frameId,
        title: String(frame?.name || 'Marco desconocido'),
        items: frameItems,
      }
    }).filter((section) => section.items.length > 0)

    const unframedItems = sortedCharacters.filter((character) => {
      const key = String(character?.name || '').trim().toLowerCase()
      return key ? characterFrameIndex.get(key)?.has('__unframed__') : false
    })

    if (unframedItems.length > 0) {
      sections.push({ id: '__unframed__', title: 'Sin marco asignado', items: unframedItems })
    }

    return sections
  }, [selectedFrameId, filteredCharacters, frames, sortedCharacters, characterFrameIndex, frameNameById])

  if (loading) return <div className="p-8 text-center">{t('loading')}</div>

  if (!isAtLeastCurator) {
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
          <h2 className="text-2xl font-semibold">{t('characters')}</h2>
          <div className="flex items-center gap-3">
            {frames.length > 0 && (
              <select
                value={selectedFrameId || ''}
                onChange={e => setSelectedFrameId(e.target.value || null)}
                className="px-3 py-1 border rounded text-sm bg-white"
              >
                <option value="">Todos los marcos</option>
                {frames.map(frame => (
                  <option key={frame.id} value={frame.id}>{frame.name}</option>
                ))}
              </select>
            )}
            <button
              onClick={() => {
                setEditingCharacter(null)
                setFormData({
                  name: '',
                  alias: '',
                  description: '',
                  image_url: '',
                  frame_ids: [],
                  face_crop_x: 50,
                  face_crop_y: 40,
                  face_crop_scale: 1,
                  face_crop_size: 55,
                })
                setImagePreview('')
                setShowForm(true)
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              + {t('addCharacter')}
            </button>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-8">
              <h3 className="text-xl font-bold mb-4">
                {editingCharacter ? t('edit') : t('addCharacter')}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder={t('characterName')}
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border rounded"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Alias (conocido como)"
                    value={formData.alias}
                    onChange={e => setFormData({ ...formData, alias: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                </div>

                <textarea
                  placeholder={t('description')}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows={4}
                />

                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">Marcos históricos</h4>
                      <p className="text-xs text-slate-500">Marca uno o varios marcos para este personaje.</p>
                    </div>
                    {formData.frame_ids.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, frame_ids: [] })}
                        className="text-xs font-medium text-slate-600 hover:text-slate-900"
                      >
                        Limpiar selección
                      </button>
                    )}
                  </div>

                  {formData.frame_ids.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.frame_ids.map((frameId) => (
                        <button
                          key={frameId}
                          type="button"
                          onClick={() => toggleFrame(frameId)}
                          className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100"
                        >
                          {frameNameById.get(frameId) || 'Marco desconocido'} ×
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="max-h-56 overflow-y-auto space-y-2 rounded-lg bg-white p-3 border border-slate-200">
                    {frames.length === 0 ? (
                      <p className="text-sm text-slate-500">No hay marcos disponibles.</p>
                    ) : (
                      frames.map((frame) => {
                        const selected = formData.frame_ids.includes(frame.id)
                        return (
                          <label
                            key={frame.id}
                            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${selected ? 'border-sky-300 bg-sky-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleFrame(frame.id)}
                              className="mt-1"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-slate-900">{frame.name}</div>
                              <div className="text-xs text-slate-500">
                                {[frame.start_date, frame.end_date].filter(Boolean).join(' - ') || 'Sin rango definido'}
                              </div>
                            </div>
                          </label>
                        )
                      })
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder={t('imageUrl')}
                    value={formData.image_url}
                    onChange={e => handleImageUrlChange(e.target.value)}
                    className="flex-1 p-2 border rounded"
                  />
                  <button
                    type="button"
                    onClick={() => handleImageUrlChange('')}
                    className="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600 text-sm"
                  >
                    Limpiar
                  </button>
                </div>

                {imagePreview && (
                  <div className="mt-2 p-2 border rounded bg-gray-50">
                    <p className="text-sm text-gray-600 mb-1">{t('imagePreview')}:</p>
                    <div className="flex items-center justify-center gap-4">
                      <OptimizedImage 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-24 h-24 object-cover rounded mx-auto"
                      />
                      <div
                        className="rounded-full overflow-hidden border-2 border-white shadow-[0_4px_12px_rgba(15,23,42,0.35)]"
                        style={{
                          width: `${Math.max(30, formData.face_crop_size)}px`,
                          height: `${Math.max(30, formData.face_crop_size)}px`,
                          transform: `scale(${Math.max(0.5, formData.face_crop_scale)})`,
                          transformOrigin: 'center center',
                        }}
                      >
                        <div
                          className="w-full h-full"
                          style={{
                            backgroundImage: `url(${imagePreview})`,
                            backgroundSize: 'cover',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: `${formData.face_crop_x}% ${formData.face_crop_y}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {imagePreview && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                    <h4 className="text-sm font-semibold text-slate-800">Ajuste de rostro (para animaciones)</h4>
                    <label className="text-xs text-slate-600 block">
                      Horizontal: {Math.round(formData.face_crop_x)}%
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={formData.face_crop_x}
                      onChange={e => setFormData({ ...formData, face_crop_x: Number(e.target.value) })}
                      className="w-full"
                    />

                    <label className="text-xs text-slate-600 block">
                      Vertical: {Math.round(formData.face_crop_y)}%
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={formData.face_crop_y}
                      onChange={e => setFormData({ ...formData, face_crop_y: Number(e.target.value) })}
                      className="w-full"
                    />

                    <label className="text-xs text-slate-600 block">
                      Zoom: {formData.face_crop_scale.toFixed(2)}x
                    </label>
                    <input
                      type="range"
                      min={0.5}
                      max={2.5}
                      step={0.05}
                      value={formData.face_crop_scale}
                      onChange={e => setFormData({ ...formData, face_crop_scale: Number(e.target.value) })}
                      className="w-full"
                    />

                    <label className="text-xs text-slate-600 block">
                      Tamaño: {Math.round(formData.face_crop_size)}px
                    </label>
                    <input
                      type="range"
                      min={30}
                      max={90}
                      value={formData.face_crop_size}
                      onChange={e => setFormData({ ...formData, face_crop_size: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                )}
                
                <div className="flex gap-2 pt-4">
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                    {t('save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingCharacter(null)
                      setImagePreview('')
                      setFormData({
                        name: '',
                        alias: '',
                        description: '',
                        image_url: '',
                        frame_ids: [],
                        face_crop_x: 50,
                        face_crop_y: 40,
                        face_crop_scale: 1,
                        face_crop_size: 55,
                      })
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

        {frameSections.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white/70 p-8 text-center text-gray-600">
            No hay personajes vinculados a marcos historicos todavia.
          </div>
        ) : (
          <div className="space-y-8">
            {frameSections.map((section) => (
              <section key={section.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800">{section.title}</h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {section.items.length} personajes
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {section.items.map((char) => {
                    const characterKey = String(char?.name || '').trim().toLowerCase()
                    const frameIds = Array.from(characterFrameIndex.get(characterKey) || [])
                    const frameLabels = frameIds.map((frameId) => {
                      if (frameId === '__unframed__') return 'Sin marco'
                      return frameNameById.get(frameId) || 'Marco desconocido'
                    })

                    return (
                      <article
                        key={char.id}
                        className="h-72 rounded-2xl border border-white/70 bg-white/75 backdrop-blur-sm p-4 shadow-[0_10px_30px_rgba(15,23,42,0.10)] hover:shadow-[0_16px_36px_rgba(15,23,42,0.16)] transition"
                      >
                        <div className="flex h-full gap-3">
                          {char.image_url ? (
                            <OptimizedImage
                              src={char.image_url}
                              alt={char.name}
                              className="w-16 h-16 object-cover rounded-lg ring-1 ring-slate-200"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                              {t('noImage')}
                            </div>
                          )}

                          <div className="flex-1 min-w-0 flex flex-col">
                            <h4 className="font-semibold text-base text-slate-900 leading-tight drop-shadow-[0_1px_0_rgba(255,255,255,0.75)]">
                              {char.name}
                            </h4>
                            {char.alias && (
                              <p className="text-xs text-slate-500 mt-0.5">({char.alias})</p>
                            )}

                            <div className="mt-2 flex flex-wrap gap-1">
                              {frameLabels.slice(0, 2).map((label) => (
                                <span key={`${char.id}-${label}`} className="rounded-full bg-sky-50 border border-sky-100 px-2 py-0.5 text-[11px] text-sky-700">
                                  {label}
                                </span>
                              ))}
                              {frameLabels.length > 2 && (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                                  +{frameLabels.length - 2}
                                </span>
                              )}
                            </div>

                            <div className="mt-2 flex-1 overflow-y-auto pr-1 text-sm text-slate-700 leading-relaxed">
                              {char.description || 'Sin descripcion'}
                            </div>

                            <div className="pt-2 mt-2 border-t border-slate-200 flex gap-3 text-sm">
                              <button
                                onClick={() => handleEdit(char)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                {t('edit')}
                              </button>
                              <button
                                onClick={() => handleDelete(char.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                {t('delete')}
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
