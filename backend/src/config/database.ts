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
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: {
    // A backend process can sit idle for long periods. Use an explicit heartbeat
    // shorter than common proxy idle timeouts and allow slow channel joins enough
    // time before Realtime reports TIMED_OUT.
    heartbeatIntervalMs: 15_000,
    timeout: 30_000,
    reconnectAfterMs: (attempt: number) => (
      Math.min(1_000 * (2 ** Math.min(attempt, 5)), 30_000)
    ),
    heartbeatCallback: (status) => {
      if (status === 'error' || status === 'timeout' || status === 'disconnected') {
        console.warn('[chat-push] Supabase Realtime heartbeat status', { status });
      }
    }
  }
});

export { supabaseUrl, supabaseKey };
