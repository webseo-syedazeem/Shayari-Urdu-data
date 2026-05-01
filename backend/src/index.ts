import express from 'express';
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

dotenv.config(); // loads backend/.env from the backend directory

const app = express();
const PORT = process.env.PORT || 3001;

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

// HTTP request logger: METHOD URL STATUS RESPONSE-TIME
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

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

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\nBackend running on http://localhost:${PORT}`);
  console.log(`Supabase URL: ${process.env.SUPABASE_URL}`);
  console.log(`Using: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service_role key ✓' : 'anon key (no service role set)'}\n`);
});
