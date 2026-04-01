import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import poetsRouter from './routes/poets';
import shayariRouter from './routes/shayari';
import topicsRouter from './routes/topics';
import tagsRouter from './routes/tags';
import collectionsRouter from './routes/collections';
import ebooksRouter from './routes/ebooks';
import dictionaryRouter from './routes/dictionary';
import adSlotsRouter from './routes/adSlots';

dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/poets', poetsRouter);
app.use('/api/shayari', shayariRouter);
app.use('/api/topics', topicsRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/collections', collectionsRouter);
app.use('/api/ebooks', ebooksRouter);
app.use('/api/dictionary', dictionaryRouter);
app.use('/api/ad-slots', adSlotsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
