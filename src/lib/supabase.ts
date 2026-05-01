export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3001';

// These exports are kept so existing imports don't break
export const hasSupabaseEnv = true;
export const isUsingSupabaseFallback = false;
export function getSupabaseEnvErrorMessage() { return ''; }
