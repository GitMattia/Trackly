import { supabase } from './supabaseClient.js';

export async function fetchEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('id, date, title, circuit, organizer')
    .order('date', { ascending: true });

  if (error) {
    return { data: null, error };
  }

  return { data };
}

export async function seedEventsData(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { data: null, error: new Error('Dati eventi mancanti per la funzione di seed.') };
  }

  const { data, error } = await supabase
    .from('events')
    .insert(rows)
    .select('*');

  return { data, error };
}
