import { createClient } from '@supabase/supabase-js';

const fallbackSupabaseUrl = 'https://kznnakhotfolzjldnxoc.supabase.co';
const fallbackSupabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6bm5ha2hvdGZvbHpqbGRueG9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NTA1MzgsImV4cCI6MjA4MTAyNjUzOH0.c_lvJ0qkcrUrrYc1aWZXS9nh9zRCvYqEqae3R0-ZW9Y';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase KEY:', supabaseKey);

if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
  console.error('Invalid Supabase URL:', supabaseUrl);
}

if (!supabaseKey) {
  console.error('Missing Supabase Key');
}

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseUrl.startsWith('http') && supabaseKey);
export const isUsingSupabaseFallback = !hasSupabaseEnv;

export function getSupabaseEnvErrorMessage() {
  const issues: string[] = [];

  if (!supabaseUrl) {
    issues.push('VITE_SUPABASE_URL is missing');
  } else if (!supabaseUrl.startsWith('http')) {
    issues.push('VITE_SUPABASE_URL is invalid');
  }

  if (!supabaseKey) {
    issues.push('VITE_SUPABASE_ANON_KEY is missing');
  }

  return issues.length > 0 ? issues.join(', ') : '';
}

export const supabase = createClient(
  hasSupabaseEnv ? supabaseUrl : fallbackSupabaseUrl,
  hasSupabaseEnv ? supabaseKey : fallbackSupabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
