export interface User {
  id: string
  email: string
  full_name: string
  role: 'regular' | 'super_user'
  created_at: string
}

export interface HistoricalEvent {
  id: string
  user_id: string
  lat: number
  lng: number
  title: string
  description: string
  event_date: string // YYYY-MM-DD
  characters: string[] // JSON array of character names
  status: 'pending' | 'approved'
  created_at: string
}

export interface Character {
  id: string
  name: string
  description?: string
  image_url?: string
  created_at: string
}

export interface Frame {
  id: string
  name: string
  description?: string
  start_date?: string
  end_date?: string
  created_at: string
}