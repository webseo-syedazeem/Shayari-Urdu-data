import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
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
import importWordPressRawRouter from './routes/importWordPressRaw';
import chatRouter from './routes/chat';
import aiImageSettingsRouter from './routes/aiImageSettings';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: corsOrigin }));
app.use(express.json());
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
app.use('/images', express.static(path.join(__dirname, '../public'), {
  fallthrough: false,
  maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0
}));

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
app.use('/api/import/wordpress-raw', importWordPressRawRouter);
app.use('/api/chat', chatRouter);
app.use('/api/ai-image-settings', aiImageSettingsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\nBackend running on http://localhost:${PORT}`);
  console.log(`Supabase URL: ${process.env.SUPABASE_URL}`);
  console.log(`Using: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service_role key ✓' : 'anon key (no service role set)'}\n`);
});
