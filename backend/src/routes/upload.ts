import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import { supabaseUrl, supabaseKey } from '../config/database';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const url = supabaseUrl as string;
const serviceKey = supabaseKey as string;
const BUCKET_NAME = 'media';

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const { entityType, entityId } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'No file provided' });
    if (!entityType || !entityId) return res.status(400).json({ error: 'entityType and entityId required' });

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type. Allowed: JPG, PNG, WEBP' });
    }

    // Use service role key to bypass storage RLS
    const supabase = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.some((b: any) => b.name === BUCKET_NAME)) {
      await supabase.storage.createBucket(BUCKET_NAME, { public: true, fileSizeLimit: 5 * 1024 * 1024 });
    }

    const timestamp = Date.now();
    const ext = file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
    const prefix = entityType === 'poets' ? 'avatar' : entityType === 'shayari' ? 'featured' : 'cover';
    const filePath = `${entityType}/${entityId}/${prefix}-${timestamp}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file.buffer, { contentType: file.mimetype, cacheControl: '3600', upsert: false });

    if (uploadError) {
      return res.status(500).json({ error: `Upload failed: ${uploadError.message}` });
    }

    const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    res.json({ success: true, publicUrl: urlData.publicUrl, path: filePath });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

router.delete('/', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const { path } = req.body;
    if (!path) return res.status(400).json({ error: 'path required' });

    const supabase = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
    if (error) return res.status(500).json({ error: error.message });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Delete failed' });
  }
});

export default router;
