import { supabase } from '@/lib/supabase';

// User functions
export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

// Frame functions
export async function getFrames() {
  const { data } = await supabase.from('frames').select('*');
  return data || [];
}

export async function fetchFrames() {
  return await getFrames();
}

export async function createFrame(name: string, description?: string, start_date?: string, end_date?: string) {
  const { data, error } = await supabase.from('frames').insert([
    { name, description, start_date, end_date }
  ]);
  
  if (error) throw error;
  return data;
}

// Character functions
export async function getCharacters() {
  const { data } = await supabase.from('characters').select('*');
  return data || [];
}

export async function fetchCharacters() {
  return await getCharacters();
}

export async function upsertCharacters(characters: any[]) {
  // This is for bulk upsert of characters
  const results = [];
  for (const character of characters) {
    const { data, error } = await supabase.from('characters').upsert(
      character,
      { onConflict: 'name' }
    );
    if (error) throw error;
    results.push(data);
  }
  return results;
}

export async function createCharacter(name: string, description?: string, image_url?: string) {
  const { data, error } = await supabase.from('characters').insert([
    { name, description, image_url }
  ]);
  
  if (error) throw error;
  return data;
}

// Event functions
export async function getEvents() {
  const { data } = await supabase.from('events').select('*');
  return data || [];
}

export async function getEventsByUser(userId: string) {
  const { data } = await supabase.from('events').select('*').eq('user_id', userId);
  return data || [];
}

export async function fetchEvents() {
  return await getEvents();
}

export async function createEvent(eventData: any) {
  const { data, error } = await supabase.from('events').insert([eventData]);
  if (error) throw error;
  return data;
}

// Admin functions
export async function getPendingEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*, users(full_name, email)')
    .eq('status', 'pending');
  
  if (error) throw error;
  return data || [];
}

export async function approveEvent(eventId: string) {
  const { data, error } = await supabase
    .from('events')
    .update({ status: 'approved' })
    .eq('id', eventId);
  
  if (error) throw error;
  return data;
}

export async function rejectEvent(eventId: string) {
  const { data, error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId);
  
  if (error) throw error;
  return data;
}
