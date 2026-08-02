import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('https://'),
  )
}

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
)
