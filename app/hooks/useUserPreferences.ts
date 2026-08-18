'use client'

import { useRef, useCallback } from 'react'

interface Preferences {
  last_frame_id: string | null
  last_year: number | null
  last_lat: number | null
  last_lng: number | null
  last_zoom: number | null
}

export function useUserPreferences(userId: string | null) {
  const saveTimeout = useRef<NodeJS.Timeout>()

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token')
    }
    return null
  }

  const savePreferences = useCallback(async (prefs: Preferences) => {
    if (!userId) {
      console.log('❌ No userId, no se guarda')
      return
    }
    
    const token = getToken()
    if (!token) {
      console.log('❌ No token disponible para guardar')
      return
    }
    
    try {
      console.log('💾 Guardando preferencias:', prefs)
      
      const response = await fetch('http://localhost:3001/api/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(prefs)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        console.log('✅ Preferencias guardadas en servidor', data)
      } else {
        console.log('❌ Error guardando:', data)
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
    }
  }, [userId])

  const loadPreferences = useCallback(async (): Promise<Preferences | null> => {
    if (!userId) {
      console.log('❌ No userId, no se cargan preferencias')
      return null
    }
    
    const token = getToken()
    if (!token) {
      console.log('❌ No token disponible para cargar, esperando...')
      // Esperar un poco y reintentar
      await new Promise(resolve => setTimeout(resolve, 500))
      const retryToken = getToken()
      if (!retryToken) {
        console.log('❌ No token después de reintento')
        return null
      }
      return loadPreferences() // Reintentar
    }
    
    try {
      console.log('📥 Cargando preferencias para userId:', userId)
      
      const response = await fetch('http://localhost:3001/api/user/preferences', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      console.log('📥 Respuesta del servidor:', data)
      
      if (response.ok && data.hasPreferences) {
        console.log('✅ Preferencias cargadas:', data.preferences)
        return {
          last_frame_id: data.preferences.last_frame_id || null,
          last_year: data.preferences.last_year || null,
          last_lat: data.preferences.last_lat || null,
          last_lng: data.preferences.last_lng || null,
          last_zoom: data.preferences.last_zoom || null
        }
      } else {
        console.log('📭 No hay preferencias guardadas')
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    }
    
    return null
  }, [userId])

  const debouncedSave = useCallback((prefs: Preferences) => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current)
    }
    saveTimeout.current = setTimeout(() => {
      savePreferences(prefs)
    }, 1000)
  }, [savePreferences])

  return { savePreferences, loadPreferences, debouncedSave }
}
