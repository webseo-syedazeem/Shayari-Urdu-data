import { createClient } from '@supabase/supabase-js';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3001';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// These exports are kept so existing imports don't break
export const hasSupabaseEnv = true;
export const isUsingSupabaseFallback = false;
export function getSupabaseEnvErrorMessage() { return ''; }
