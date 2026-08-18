'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'
import html2canvas from 'html2canvas'
import Navbar from '@/app/components/layout/Navbar'
import { api, auth } from '@/lib/api'
import { t } from '@/app/lib/i18n'

const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then((m) => m.Marker), { ssr: false })
const Polyline = dynamic(() => import('react-leaflet').then((m) => m.Polyline), { ssr: false })

type PixelOffset = { offsetIndex: number; groupCount: number }

// Clusters markers by actual on-screen pixel distance (not lat/lng) so overlap
// detection stays correct at any zoom level.
const MarkerSpreadSync = dynamic(
  () =>
    import('react-leaflet').then((m) => {
      const useMapHook = m.useMap
      return function MarkerSpreadSyncInner({
        travellers,
        onCompute,
      }: {
        travellers: Array<{ character: Character; latlng: [number, number] }>
        onCompute: (offsets: Record<string, PixelOffset>) => void
      }) {
        const map = useMapHook()

        useEffect(() => {
          const CLUSTER_THRESHOLD_PX = 50

          const compute = () => {
            const points = travellers.map((t) => ({
              key: t.character.id,
              pt: map.latLngToContainerPoint(t.latlng),
            }))

            const used = new Array(points.length).fill(false)
            const clusters: number[][] = []

            for (let i = 0; i < points.length; i++) {
              if (used[i]) continue
              const cluster = [i]
              used[i] = true
              const pointI = points[i]
              for (let j = i + 1; j < points.length; j++) {
                if (used[j]) continue
                const pointJ = points[j]
                if (!pointI || !pointJ) continue
                const dx = pointI.pt.x - pointJ.pt.x
                const dy = pointI.pt.y - pointJ.pt.y
                if (Math.sqrt(dx * dx + dy * dy) < CLUSTER_THRESHOLD_PX) {
                  cluster.push(j)
                  used[j] = true
                }
              }
              clusters.push(cluster)
            }

            const result: Record<string, PixelOffset> = {}
            clusters.forEach((cluster) => {
              cluster.forEach((idx, i) => {
                const point = points[idx]
                if (!point) return
                result[point.key] = { offsetIndex: i, groupCount: cluster.length }
              })
            })
            onCompute(result)
          }

          compute()
          map.on('zoom', compute)
          map.on('move', compute)
          return () => {
            map.off('zoom', compute)
            map.off('move', compute)
          }
        }, [travellers, map, onCompute])

        return null
      }
    }),
  { ssr: false }
)

type Character = {
  id: string
  name: string
  alias?: string | null
  image_url?: string | null
  face_crop_x?: number | null
  face_crop_y?: number | null
  face_crop_scale?: number | null
  face_crop_size?: number | null
}

type EventCharacter = string | { id?: string; name?: string }

type EventPoint = {
  id: string
  title: string
  event_date?: string
  start_date?: string
  lat?: number
  lng?: number
  latitude?: number
  longitude?: number
  characters?: EventCharacter[]
}

type CropState = {
  x: number
  y: number
  scale: number
  size: number
}

type CharacterPath = {
  character: Character
  points: EventPoint[]
}

const defaultCrop: CropState = {
  x: 50,
  y: 40,
  scale: 1,
  size: 55,
}

const parseEventDate = (event: EventPoint): Date | null => {
  const raw = event.event_date || event.start_date
  if (!raw) return null
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const parseCoord = (value: unknown): number | null => {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const getEventLatLng = (event: EventPoint): [number, number] | null => {
  const lat = parseCoord(event.lat ?? event.latitude)
  const lng = parseCoord(event.lng ?? event.longitude)
  if (lat == null || lng == null) return null
  return [lat, lng]
}

const eventHasCharacter = (event: EventPoint, character: Character): boolean => {
  if (!Array.isArray(event.characters)) return false
  return event.characters.some((item) => {
    if (typeof item === 'string') {
      return item.trim().toLowerCase() === character.name.toLowerCase()
    }
    return (item.id && item.id === character.id) || (item.name && item.name.trim().toLowerCase() === character.name.toLowerCase())
  })
}


const PIXEL_SPACING = 68

export default function TravelAnimationPage() {
  const [events, setEvents] = useState<EventPoint[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([])
  const [mode, setMode] = useState<'dates' | 'events'>('dates')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [startEventId, setStartEventId] = useState('')
  const [endEventId, setEndEventId] = useState('')
  const [speedMs, setSpeedMs] = useState(1800)
  const [progress, setProgress] = useState(0)
  const [playhead, setPlayhead] = useState(0)
  const [statusText, setStatusText] = useState('')
  const [cropByCharacter, setCropByCharacter] = useState<Record<string, CropState>>({})
  const [focusedCharacterId, setFocusedCharacterId] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const [recordingSupported, setRecordingSupported] = useState(false)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [leaflet, setLeaflet] = useState<typeof import('leaflet') | null>(null)

  const mapHostRef = useRef<HTMLDivElement | null>(null)
  const playbackRafRef = useRef<number | null>(null)
  const playbackLastTimeRef = useRef<number | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const mediaChunksRef = useRef<BlobPart[]>([])
  const frameCaptureTimerRef = useRef<NodeJS.Timeout | null>(null)

  const currentUser = auth.getUser()

  useEffect(() => {
    setRecordingSupported(typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined')
  }, [])

  useEffect(() => {
    void import('leaflet').then(setLeaflet)
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [eventsData, charactersData] = await Promise.all([api.getEvents(), api.getCharacters()])
        setEvents((eventsData || []).filter((e: EventPoint) => getEventLatLng(e) !== null))
        setCharacters(charactersData || [])
      } catch (error) {
        console.error('Error loading animation data:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (characters.length > 0 && focusedCharacterId == null) {
      setFocusedCharacterId(characters[0]?.id || null)
    }
  }, [characters, focusedCharacterId])

  useEffect(() => {
    return () => {
      if (playbackRafRef.current != null) cancelAnimationFrame(playbackRafRef.current)
      if (frameCaptureTimerRef.current) clearInterval(frameCaptureTimerRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      if (recordedUrl) URL.revokeObjectURL(recordedUrl)
    }
  }, [recordedUrl])

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const da = parseEventDate(a)?.getTime() ?? 0
      const db = parseEventDate(b)?.getTime() ?? 0
      return da - db
    })
  }, [events])

  const selectedCharacters = useMemo(() => {
    return characters.filter((character) => selectedCharacterIds.includes(character.id))
  }, [characters, selectedCharacterIds])

  const rangeFilteredEvents = useMemo(() => {
    if (mode === 'dates') {
      const from = startDate ? new Date(startDate).getTime() : Number.NEGATIVE_INFINITY
      const to = endDate ? new Date(endDate).getTime() : Number.POSITIVE_INFINITY
      return sortedEvents.filter((event) => {
        const time = parseEventDate(event)?.getTime()
        return typeof time === 'number' && time >= from && time <= to
      })
    }

    const startIdx = sortedEvents.findIndex((event) => event.id === startEventId)
    const endIdx = sortedEvents.findIndex((event) => event.id === endEventId)

    if (startIdx === -1 || endIdx === -1) return sortedEvents
    const minIdx = Math.min(startIdx, endIdx)
    const maxIdx = Math.max(startIdx, endIdx)
    return sortedEvents.slice(minIdx, maxIdx + 1)
  }, [mode, sortedEvents, startDate, endDate, startEventId, endEventId])

  const characterPaths = useMemo<CharacterPath[]>(() => {
    return selectedCharacters
      .map((character) => {
        const points = rangeFilteredEvents.filter((event) => eventHasCharacter(event, character))
        return { character, points }
      })
      .filter((item) => item.points.length >= 1)
  }, [selectedCharacters, rangeFilteredEvents])

  const totalSegments = useMemo(() => {
    return characterPaths.reduce((acc, path) => Math.max(acc, Math.max(0, path.points.length - 1)), 0)
  }, [characterPaths])

  const mapCenter = useMemo<[number, number]>(() => {
    const first = rangeFilteredEvents.find((event) => getEventLatLng(event) != null)
    return first ? (getEventLatLng(first) as [number, number]) : [20, 0]
  }, [rangeFilteredEvents])

  const mapLines = useMemo(() => {
    return characterPaths
      .map((path) => ({
        id: path.character.id,
        latlngs: path.points.map((point) => getEventLatLng(point)).filter(Boolean) as [number, number][],
      }))
      .filter((line) => line.latlngs.length > 1)
  }, [characterPaths])

  const activeTravellers = useMemo(() => {
    return characterPaths
      .map((path) => {
        const pathLastIndex = path.points.length - 1
        const safePlayhead = Math.max(0, Math.min(playhead, pathLastIndex))
        const fromIndex = Math.floor(safePlayhead)
        const toIndex = Math.min(fromIndex + 1, pathLastIndex)
        const blend = Math.max(0, Math.min(1, safePlayhead - fromIndex))

        const fromPoint = path.points[fromIndex]
        const toPoint = path.points[toIndex]
        const fromLatLng = fromPoint ? getEventLatLng(fromPoint) : null
        const toLatLng = toPoint ? getEventLatLng(toPoint) : null

        if (!fromPoint || !toPoint || !fromLatLng || !toLatLng) return null

        const interpolatedLat = fromLatLng[0] + (toLatLng[0] - fromLatLng[0]) * blend
        const interpolatedLng = fromLatLng[1] + (toLatLng[1] - fromLatLng[1]) * blend

        const activePoint = blend >= 0.5 ? toPoint : fromPoint
        return {
          character: path.character,
          point: activePoint,
          latlng: [interpolatedLat, interpolatedLng] as [number, number],
        }
      })
      .filter(Boolean) as Array<{ character: Character; point: EventPoint; latlng: [number, number] }>
  }, [characterPaths, playhead])

  const [pixelOffsets, setPixelOffsets] = useState<Record<string, PixelOffset>>({})
  const handleComputeOffsets = useCallback((offsets: Record<string, PixelOffset>) => {
    setPixelOffsets(offsets)
  }, [])

  const focusedCharacter = characters.find((c) => c.id === focusedCharacterId)
  const focusedCrop = useMemo(() => {
    if (!focusedCharacterId) return defaultCrop
    if (cropByCharacter[focusedCharacterId]) return cropByCharacter[focusedCharacterId]
    if (focusedCharacter) {
      return {
        x: typeof focusedCharacter.face_crop_x === 'number' ? focusedCharacter.face_crop_x : defaultCrop.x,
        y: typeof focusedCharacter.face_crop_y === 'number' ? focusedCharacter.face_crop_y : defaultCrop.y,
        scale: typeof focusedCharacter.face_crop_scale === 'number' ? focusedCharacter.face_crop_scale : defaultCrop.scale,
        size: typeof focusedCharacter.face_crop_size === 'number' ? focusedCharacter.face_crop_size : defaultCrop.size,
      }
    }
    return defaultCrop
  }, [focusedCharacterId, cropByCharacter, focusedCharacter])

  const setFocusedCrop = (patch: Partial<CropState>) => {
    if (!focusedCharacterId) return
    setCropByCharacter((prev) => {
      const current = prev[focusedCharacterId] || (focusedCharacter ? {
        x: typeof focusedCharacter.face_crop_x === 'number' ? focusedCharacter.face_crop_x : defaultCrop.x,
        y: typeof focusedCharacter.face_crop_y === 'number' ? focusedCharacter.face_crop_y : defaultCrop.y,
        scale: typeof focusedCharacter.face_crop_scale === 'number' ? focusedCharacter.face_crop_scale : defaultCrop.scale,
        size: typeof focusedCharacter.face_crop_size === 'number' ? focusedCharacter.face_crop_size : defaultCrop.size,
      } : defaultCrop)

      return {
        ...prev,
        [focusedCharacterId]: {
          ...current,
          ...patch,
        },
      }
    })
  }

  const stopPlayback = useCallback(() => {
    if (playbackRafRef.current != null) {
      cancelAnimationFrame(playbackRafRef.current)
      playbackRafRef.current = null
    }
    playbackLastTimeRef.current = null
    setStatusText('')
  }, [])

  const startPlayback = useCallback(() => {
    if (totalSegments === 0 || characterPaths.length === 0) {
      setStatusText('No travel path available for current selection.')
      return
    }

    if (playbackRafRef.current != null) cancelAnimationFrame(playbackRafRef.current)
    playbackLastTimeRef.current = null

    setPlayhead(0)
    setProgress(0)
    setStatusText('Animation running...')

    const stepDurationMs = Math.max(400, speedMs)

    const tick = (timestamp: number) => {
      if (playbackLastTimeRef.current == null) {
        playbackLastTimeRef.current = timestamp
      }

      const deltaMs = timestamp - (playbackLastTimeRef.current || timestamp)
      playbackLastTimeRef.current = timestamp

      setPlayhead((current) => {
        const next = current + deltaMs / stepDurationMs
        if (next >= totalSegments) {
          setProgress(100)
          stopPlayback()
          return totalSegments
        }

        const pct = Math.round((next / Math.max(1, totalSegments)) * 100)
        setProgress(pct)
        return next
      })

      playbackRafRef.current = requestAnimationFrame(tick)
    }

    playbackRafRef.current = requestAnimationFrame(tick)
  }, [totalSegments, characterPaths.length, speedMs, stopPlayback])

  const toggleCharacter = (characterId: string) => {
    setSelectedCharacterIds((prev) => {
      if (prev.includes(characterId)) {
        return prev.filter((id) => id !== characterId)
      }
      return [...prev, characterId]
    })
  }

  const startRecording = useCallback(async () => {
    if (!recordingSupported || !mapHostRef.current) {
      setStatusText('Recording is not supported in this browser.')
      return
    }

    setRecordedUrl((oldUrl) => {
      if (oldUrl) URL.revokeObjectURL(oldUrl)
      return null
    })

    const stream = new MediaStream()
    mediaStreamRef.current = stream
    mediaChunksRef.current = []

    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' })
    mediaRecorderRef.current = recorder

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) mediaChunksRef.current.push(event.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(mediaChunksRef.current, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      setRecordedUrl(url)
      setRecording(false)
      setStatusText('Recording complete. Download is ready (WebM).')

      stream.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
      mediaRecorderRef.current = null
      mediaChunksRef.current = []
      if (frameCaptureTimerRef.current) {
        clearInterval(frameCaptureTimerRef.current)
        frameCaptureTimerRef.current = null
      }
    }

    recorder.start(300)
    setRecording(true)
    setStatusText('Recording animation...')

    frameCaptureTimerRef.current = setInterval(async () => {
      if (!mapHostRef.current || !mediaStreamRef.current) return
      try {
        const canvas = await html2canvas(mapHostRef.current, {
          useCORS: true,
          backgroundColor: null,
          logging: false,
        })

        const frameStream = canvas.captureStream(24)
        const [videoTrack] = frameStream.getVideoTracks()
        if (!videoTrack) return

        const existingTrack = mediaStreamRef.current.getVideoTracks()[0]
        if (!existingTrack) {
          mediaStreamRef.current.addTrack(videoTrack)
        } else {
          existingTrack.stop()
          mediaStreamRef.current.removeTrack(existingTrack)
          mediaStreamRef.current.addTrack(videoTrack)
        }
      } catch (error) {
        console.error('Recording frame capture error:', error)
      }
    }, 180)
  }, [recordingSupported])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  if (loading) {
    return (
      <>
        <Navbar />
        <main className='p-8 max-w-7xl mx-auto'>
          <div>{t('loading')}</div>
        </main>
      </>
    )
  }

  if (!currentUser) {
    return (
      <>
        <Navbar />
        <main className='p-8 max-w-7xl mx-auto'>
          <h1 className='text-3xl font-bold mb-4'>Character Travel Animation</h1>
          <p>Please sign in to use animation playback and export.</p>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className='p-6 max-w-7xl mx-auto space-y-4'>
        <div>
          <h1 className='text-3xl font-bold'>Character Travel Animation</h1>
          <p className='text-gray-600'>Animate one or many characters moving between chronological events.</p>
        </div>

        <section className='grid lg:grid-cols-3 gap-4'>
          <div className='lg:col-span-1 space-y-4'>
            <div className='rounded-lg border p-4 space-y-3'>
              <h2 className='font-semibold'>1) Characters</h2>
              <div className='max-h-48 overflow-y-auto border rounded p-2 space-y-1'>
                {characters.map((character) => (
                  <label key={character.id} className='flex items-center gap-2 text-sm'>
                    <input
                      type='checkbox'
                      checked={selectedCharacterIds.includes(character.id)}
                      onChange={() => toggleCharacter(character.id)}
                    />
                    <span>{character.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className='rounded-lg border p-4 space-y-3'>
              <h2 className='font-semibold'>2) Time Range</h2>
              <div className='flex gap-2'>
                <button
                  className={`px-3 py-1 rounded text-sm ${mode === 'dates' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                  onClick={() => setMode('dates')}
                >
                  By Dates
                </button>
                <button
                  className={`px-3 py-1 rounded text-sm ${mode === 'events' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                  onClick={() => setMode('events')}
                >
                  By Events
                </button>
              </div>

              {mode === 'dates' ? (
                <div className='space-y-2'>
                  <input type='date' value={startDate} onChange={(e) => setStartDate(e.target.value)} className='w-full border rounded px-2 py-1' />
                  <input type='date' value={endDate} onChange={(e) => setEndDate(e.target.value)} className='w-full border rounded px-2 py-1' />
                </div>
              ) : (
                <div className='space-y-2'>
                  <select value={startEventId} onChange={(e) => setStartEventId(e.target.value)} className='w-full border rounded px-2 py-1'>
                    <option value=''>Start event</option>
                    {sortedEvents.map((event) => (
                      <option key={event.id} value={event.id}>{event.title}</option>
                    ))}
                  </select>
                  <select value={endEventId} onChange={(e) => setEndEventId(e.target.value)} className='w-full border rounded px-2 py-1'>
                    <option value=''>End event</option>
                    {sortedEvents.map((event) => (
                      <option key={event.id} value={event.id}>{event.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className='rounded-lg border p-4 space-y-3'>
              <h2 className='font-semibold'>3) Playback + Export</h2>
              <label className='block text-sm'>Speed (ms per step)</label>
              <input
                type='range'
                min={500}
                max={4000}
                step={100}
                value={speedMs}
                onChange={(e) => setSpeedMs(Number(e.target.value))}
                className='w-full'
              />
              <div className='text-sm text-gray-600'>{speedMs} ms</div>

              <div className='flex gap-2 flex-wrap'>
                <button onClick={startPlayback} className='px-3 py-2 bg-blue-600 text-white rounded'>Play</button>
                <button onClick={stopPlayback} className='px-3 py-2 bg-gray-200 rounded'>Stop</button>
                {!recording ? (
                  <button
                    onClick={startRecording}
                    disabled={!recordingSupported}
                    className='px-3 py-2 bg-emerald-600 text-white rounded disabled:opacity-60'
                  >
                    Record
                  </button>
                ) : (
                  <button onClick={stopRecording} className='px-3 py-2 bg-red-600 text-white rounded'>Stop Rec</button>
                )}
              </div>

              <div className='text-sm'>Progress: {progress}%</div>
              {statusText && <div className='text-sm text-gray-700'>{statusText}</div>}
              {recordedUrl && (
                <a href={recordedUrl} download='character-travel.webm' className='inline-block text-sm text-blue-700 underline'>
                  Download WebM video
                </a>
              )}
            </div>

            <div className='rounded-lg border p-4 space-y-3'>
              <h2 className='font-semibold'>4) Face Crop</h2>
              <select
                value={focusedCharacterId || ''}
                onChange={(e) => setFocusedCharacterId(e.target.value)}
                className='w-full border rounded px-2 py-1'
              >
                {selectedCharacters.map((character) => (
                  <option key={character.id} value={character.id}>{character.name}</option>
                ))}
              </select>

              <label className='text-xs block'>Horizontal</label>
              <input type='range' min={0} max={100} value={focusedCrop.x} onChange={(e) => setFocusedCrop({ x: Number(e.target.value) })} className='w-full' />
              <label className='text-xs block'>Vertical</label>
              <input type='range' min={0} max={100} value={focusedCrop.y} onChange={(e) => setFocusedCrop({ y: Number(e.target.value) })} className='w-full' />
              <label className='text-xs block'>Zoom</label>
              <input type='range' min={0.5} max={2.5} step={0.05} value={focusedCrop.scale} onChange={(e) => setFocusedCrop({ scale: Number(e.target.value) })} className='w-full' />
              <label className='text-xs block'>Badge size</label>
              <input type='range' min={30} max={90} value={focusedCrop.size} onChange={(e) => setFocusedCrop({ size: Number(e.target.value) })} className='w-full' />
            </div>
          </div>

          <div className='lg:col-span-2'>
            <div ref={mapHostRef} className='h-[72vh] border rounded-lg overflow-hidden relative bg-white'>
              <MapContainer center={mapCenter} zoom={4} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                  attribution='&copy; OpenStreetMap contributors'
                />

                {mapLines.map((line) => (
                  <Polyline key={line.id} positions={line.latlngs} pathOptions={{ color: '#0f766e', weight: 2 }} />
                ))}

                <MarkerSpreadSync travellers={activeTravellers} onCompute={handleComputeOffsets} />

                {activeTravellers.map(({ character, point, latlng }, index) => {
                  if (!leaflet) return null
                  const crop = cropByCharacter[character.id] || defaultCrop
                  const image = character.image_url || ''
                  const { offsetIndex, groupCount } = pixelOffsets[character.id] || { offsetIndex: 0, groupCount: 1 }

                  const html = `<div style="z-index:${1000 + index};position:relative;"><div style="display:flex;flex-direction:column;align-items:center;gap:6px;"><div style="width:55px;height:55px;border-radius:50%;border:3px solid #d4af37;box-shadow:0 4px 8px rgba(0,0,0,0.3);background-image:url('${image}');background-size:cover;background-position:${crop.x}% ${crop.y}%;filter:sepia(0.3) contrast(1.1);flex-shrink:0;"></div><div style="font-size:10px;background:rgba(0,0,0,0.85);color:#fff;padding:2px 6px;border-radius:10px;white-space:nowrap;">${character.name}</div></div></div>`

                  // Spread pixel offset keeps circles visually separated regardless of zoom level.
                  const pixelOffset = (offsetIndex - (groupCount - 1) / 2) * PIXEL_SPACING

                  const icon = leaflet.divIcon({
                    html: html,
                    iconSize: [100, 140],
                    iconAnchor: [50 - pixelOffset, 70],
                    className: `marker-${index}`,
                  })

                  return <Marker key={`${character.id}-${point.id}-${index}`} position={latlng} icon={icon} />
                })}

                {rangeFilteredEvents.slice(0, 100).map((event) => {
                  if (!leaflet) return null
                  const latlng = getEventLatLng(event)
                  if (!latlng) return null
                  const previewIcon = leaflet.divIcon({
                    className: 'travel-preview-pin',
                    html: '<div style="width:12px;height:12px;border-radius:50%;background:#1f2937;border:2px solid white;box-shadow:0 0 0 1px rgba(0,0,0,.15)"></div>',
                    iconSize: [12, 12],
                    iconAnchor: [6, 6],
                  })
                  return <Marker key={`preview-${event.id}`} position={latlng} icon={previewIcon} />
                })}
              </MapContainer>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
