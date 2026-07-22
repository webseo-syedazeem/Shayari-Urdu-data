import { Router, type Request, type Response, type NextFunction } from 'express';
import { supabase } from '../config/database';

const router = Router();

const MODELS = [
  'gpt-image-2',
  'gpt-image-1.5',
  'gpt-image-1-mini'
] as const;
const QUALITIES = ['low', 'medium', 'high'] as const;

async function requireAdminSession(req: Request, res: Response, next: NextFunction) {
  try {
    const authorization = req.headers.authorization;
    const [scheme, token] = authorization?.split(' ') || [];

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    res.locals.adminUserId = data.user.id;
    next();
  } catch (error) {
    console.error('AI settings authentication failed:', error);
    res.status(401).json({ error: 'Session check failed' });
  }
}

router.use(requireAdminSession);

router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('ai_image_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'AI image settings are not initialized' });
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching AI image settings:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch AI image settings' });
  }
});

router.put('/', async (req, res) => {
  try {
    const model = String(req.body.model || '');
    const quality = String(req.body.quality || '');
    const compression = Number(req.body.compression);

    if (!MODELS.includes(model as typeof MODELS[number])) {
      return res.status(400).json({ error: 'Unsupported image model' });
    }
    if (!QUALITIES.includes(quality as typeof QUALITIES[number])) {
      return res.status(400).json({ error: 'Unsupported image quality' });
    }
    if (!Number.isInteger(compression) || compression < 0 || compression > 100) {
      return res.status(400).json({ error: 'Compression must be an integer from 0 to 100' });
    }

    const { data, error } = await supabase
      .from('ai_image_settings')
      .upsert({
        id: 'default',
        model,
        quality,
        compression,
        updated_at: new Date().toISOString(),
        updated_by: res.locals.adminUserId
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    console.error('Error updating AI image settings:', error);
    res.status(500).json({ error: error.message || 'Failed to update AI image settings' });
  }
});

export default router;
