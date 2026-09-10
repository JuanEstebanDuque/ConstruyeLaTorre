import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export function createSupabaseClient(url: string, anonKey: string): SupabaseClient {
  if (!url) {
    throw new Error('VITE_SUPABASE_URL is required')
  }
  if (!anonKey) {
    throw new Error('VITE_SUPABASE_ANON_KEY is required')
  }
  return createClient(url, anonKey)
}

export const supabase = createSupabaseClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
