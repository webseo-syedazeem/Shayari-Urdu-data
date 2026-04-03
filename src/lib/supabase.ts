import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

const missingSupabaseEnvVars = [
  !supabaseUrl ? 'VITE_SUPABASE_URL' : null,
  !supabaseAnonKey ? 'VITE_SUPABASE_ANON_KEY' : null,
].filter(Boolean) as string[];

export const hasSupabaseEnv = missingSupabaseEnvVars.length === 0;

export function getSupabaseEnvErrorMessage() {
  if (hasSupabaseEnv) {
    return '';
  }

  return `Missing required environment variables: ${missingSupabaseEnvVars.join(', ')}`;
}

function createUnavailableClient(): SupabaseClient {
  const errorMessage = getSupabaseEnvErrorMessage();

  return new Proxy(
    {},
    {
      get() {
        throw new Error(errorMessage);
      },
    }
  ) as SupabaseClient;
}

export const supabase: SupabaseClient = hasSupabaseEnv
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createUnavailableClient();
