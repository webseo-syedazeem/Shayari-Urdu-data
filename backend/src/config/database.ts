import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config(); // loads backend/.env from the backend directory

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables.\n' +
    'Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to backend/.env\n' +
    'Get the service role key from: Supabase Dashboard → Settings → API → service_role'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export { supabaseUrl, supabaseKey };
