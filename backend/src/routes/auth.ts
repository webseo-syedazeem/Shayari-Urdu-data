import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseKey } from '../config/database';

const router = Router();

const url = supabaseUrl as string;
const serviceKey = supabaseKey as string;
const anonKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || supabaseKey) as string;

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Login must use anon key (service role key cannot sign in as a user)
    const authClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data, error } = await authClient.auth.signInWithPassword({ email, password });

    if (error) return res.status(401).json({ error: error.message });

    res.json({
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
      user: data.user
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const userClient = createClient(url, anonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { autoRefreshToken: false, persistSession: false }
      });
      await userClient.auth.signOut();
    }
    res.json({ success: true });
  } catch (error) {
    res.json({ success: true });
  }
});

router.get('/session', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    // Use service role key to verify any user's token
    const { data, error } = await createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    }).auth.getUser(token);

    if (error || !data.user) return res.status(401).json({ error: 'Invalid or expired session' });

    res.json({ user: data.user, valid: true });
  } catch (error) {
    res.status(401).json({ error: 'Session check failed' });
  }
});

export default router;
