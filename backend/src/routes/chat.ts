import { Router, Request, Response } from 'express';
import { supabase } from '../config/database';

const router = Router();

export interface ChatMessageRow {
  id: string;
  username: string;
  message: string;
  room: string;
  created_at: string;
}

const SEVEN_DAYS_AGO = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

// GET /api/chat/history?room=general
router.get('/history', async (req: Request, res: Response) => {
  const room = (req.query.room as string) || 'general';

  const { data, error } = await supabase
    .from('chat_messages')
    .select('id, username, message, room, created_at')
    .eq('room', room)
    .gte('created_at', SEVEN_DAYS_AGO())
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json(data);
});

// POST /api/chat/message
router.post('/message', async (req: Request, res: Response) => {
  const { username, message, room = 'general' } = req.body as {
    username?: string;
    message?: string;
    room?: string;
  };

  if (!username || !message) {
    return res.status(400).json({ error: 'username and message are required' });
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ username, message, room })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json(data);
});

export default router;
