import { createClient } from '@supabase/supabase-js';

// Default Supabase project credentials (public client-safe anon key and URL)
// Used when running locally or if environment variables are not explicitly set.
const DEFAULT_SUPABASE_URL = 'https://dlembbquhvrdlorondvc.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZW1iYnF1aHZyZGxvcm9uZHZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNDc3MDEsImV4cCI6MjEwNTYyMzcwMX0.VIf_54KlCCsEiTx1_HOtBeTQcynjoRIRUJ7VleaYnqI';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseUrl: string =
  (rawUrl && rawUrl.trim() !== '' && !rawUrl.includes('your-project'))
    ? rawUrl.trim()
    : DEFAULT_SUPABASE_URL;

export const supabaseAnonKey: string =
  (rawKey && rawKey.trim() !== '' && !rawKey.includes('your-anon'))
    ? rawKey.trim()
    : DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your-anon')
);

if (!isSupabaseConfigured) {
  console.warn(
    '[Supabase] Warning: Missing or placeholder Supabase credentials. Check your local .env file.'
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);