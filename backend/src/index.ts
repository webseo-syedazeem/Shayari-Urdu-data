import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import poetsRouter from './routes/poets';
import shayariRouter from './routes/shayari';
import topicsRouter from './routes/topics';
import tagsRouter from './routes/tags';
import collectionsRouter from './routes/collections';
import ebooksRouter from './routes/ebooks';
import dictionaryRouter from './routes/dictionary';
import adSlotsRouter from './routes/adSlots';
import authRouter from './routes/auth';
import uploadRouter from './routes/upload';
import importWordPressRouter from './routes/importWordPress';
import chatRouter from './routes/chat';
import { supabase } from './config/database';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

const io = new Server(httpServer, {
  cors: { origin: corsOrigin },
});

const onlineUsers = new Map<string, string>();
io.on('connection', async (socket) => {
  console.log(`Socket connected: ${socket.id}`);

 
  const { data: history } = await supabase
    .from('chat_messages')
    .select('id, username, message, room, created_at')
    .order('created_at', { ascending: false })
    .limit(30);

  const sorted = (history ?? []).reverse();
  socket.emit('chat_history', sorted);

  socket.on('user_join', (username: string) => {
    onlineUsers.set(socket.id, username);
    console.log(`User joined: ${username} (${socket.id})`);
    io.emit('online_count', onlineUsers.size);
  });

  socket.on('join_room', (room: string) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
  });

  socket.on('send_message', async (data: { username: string; message: string; time: string; room?: string }) => {
    const room = data.room || 'general';
    const { error } = await supabase
      .from('chat_messages')
      .insert({ username: data.username, message: data.message, room });

    if (error) {
      console.error('Failed to save chat message:', error.message);
    }
    io.emit('receive_message', {
      username: data.username,
      message: data.message,
      time: data.time || new Date().toISOString(),
      room,
    });
  });

  socket.on('disconnect', () => {
    onlineUsers.delete(socket.id);
    console.log(`Socket disconnected: ${socket.id}`);
    io.emit('online_count', onlineUsers.size);
  });
});

app.use(cors({ origin: corsOrigin }));
app.use(express.json());
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

app.get('/', (_req, res) => {
  res.send(`Frontend cors configured for: ${corsOrigin}`);
});
app.use('/api/auth', authRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/poets', poetsRouter);
app.use('/api/shayari', shayariRouter);
app.use('/api/topics', topicsRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/collections', collectionsRouter);
app.use('/api/ebooks', ebooksRouter);
app.use('/api/dictionary', dictionaryRouter);
app.use('/api/ad-slots', adSlotsRouter);
app.use('/api/import/wordpress', importWordPressRouter);
app.use('/api/chat', chatRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

httpServer.listen(PORT, () => {
  console.log(`\nBackend running on http://localhost:${PORT}`);
  console.log(`Socket.io ready `);
  console.log(`Supabase URL: ${process.env.SUPABASE_URL}`);
  console.log(`Using: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service_role key ✓' : 'anon key (no service role set)'}\n`);
});