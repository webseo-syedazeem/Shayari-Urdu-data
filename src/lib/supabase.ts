import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const hasSupabaseEnv =
  !!supabaseUrl &&
  supabaseUrl.startsWith('http') &&
  !!supabaseAnonKey;

export const isUsingSupabaseFallback = !hasSupabaseEnv;

export function getSupabaseEnvErrorMessage() {
  const issues: string[] = [];

  if (!supabaseUrl) {
    issues.push('VITE_SUPABASE_URL is missing');
  } else if (!supabaseUrl.startsWith('http')) {
    issues.push('VITE_SUPABASE_URL is invalid');
  }

  if (!supabaseAnonKey) {
    issues.push('VITE_SUPABASE_ANON_KEY is missing');
  }

  return issues.join(', ');
}

export const supabase = createClient(
  supabaseUrl!,
  supabaseAnonKey!
);
