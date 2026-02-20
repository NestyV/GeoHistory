import { supabase } from '@/lib/supabase'
import { HistoricalEvent, User, Character } from '@/app/types'

import { Frame } from '@/app/types'

export async function fetchEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'approved')
  
  if (error) console.error('Error fetching events:', error)
  return data || []
}

export async function addEvent(event: Omit<HistoricalEvent, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('events')
    .insert([event])
    .select()
  
  if (error) console.error('Error adding event:', error)
  return data?.[0]
}

export async function approveEvent(eventId: string) {
  const { error } = await supabase
    .from('events')
    .update({ status: 'approved' })
    .eq('id', eventId)
  
  if (error) console.error('Error approving event:', error)
}

export async function fetchUsers() {
  const { data, error } = await supabase.from('users').select('*')
  
  if (error) console.error('Error fetching users:', error)
  return data || []
}

export async function createUser(user: Omit<User, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('users')
    .insert([user])
    .select()
  
  if (error) console.error('Error creating user:', error)
  return data?.[0]
}

export async function fetchFrames() {
  const { data, error } = await supabase.from('frames').select('*')
  if (error) console.error('Error fetching frames:', error)
  return (data || []) as Frame[]
}

export async function createFrame(frame: Omit<Frame, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('frames')
    .insert([frame])
    .select()

  if (error) console.error('Error creating frame:', error)
  return data?.[0] as Frame | null
}

export async function fetchCharacters() {
  const { data, error } = await supabase.from('characters').select('*')
  if (error) console.error('Error fetching characters:', error)
  return (data || []) as Character[]
}

export async function upsertCharacters(characters: Omit<Character, 'id' | 'created_at'>[]) {
  if (!characters || characters.length === 0) return []
  
  const { data, error } = await supabase
    .from('characters')
    .upsert(characters, { onConflict: 'name' })
    .select()
  
  if (error) console.error('Error upserting characters:', error)
  return (data || []) as Character[]
}