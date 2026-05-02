import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Explicit path so the correct .env loads regardless of where node starts from
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // must use service role – never fall back to anon key

if (!supabaseKey) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE_KEY is missing in backend/.env\n' +
    'Get it from: Supabase Dashboard → Settings → API → service_role'
  );
}

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL is missing in backend/.env');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export { supabaseUrl, supabaseKey };
