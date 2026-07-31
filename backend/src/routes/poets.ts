import { Router } from 'express';
import { supabase } from '../config/database';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { page = '1', pageSize = '20', search = '' } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    let query = supabase.from('poets').select('*', { count: 'exact' });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    query = query.order('name').range(offset, offset + Number(pageSize) - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({
      data,
      pagination: { page: Number(page), pageSize: Number(pageSize), total: count || 0, totalPages: Math.ceil((count || 0) / Number(pageSize)) }
    });
  } catch (error) {
    console.error('Error fetching poets:', error);
    res.status(500).json({ error: 'Failed to fetch poets' });
  }
});

router.get('/by-id/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: poet, error } = await supabase.from('poets').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!poet) return res.status(404).json({ error: 'Poet not found' });

    const { data: shayariCounts } = await supabase.from('shayari').select('form').eq('poet_id', poet.id);
    const countsByForm = (shayariCounts || []).reduce((acc: any, s: any) => { acc[s.form] = (acc[s.form] || 0) + 1; return acc; }, {});
    const { data: popularShayari } = await supabase.from('shayari').select('id').eq('poet_id', poet.id).order('popularity_score', { ascending: false }).limit(10);

    res.json({ ...poet, shayariCounts: countsByForm, popularShayariIds: (popularShayari || []).map((s: any) => s.id) });
  } catch (error) {
    console.error('Error fetching poet by id:', error);
    res.status(500).json({ error: 'Failed to fetch poet' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { data: poet, error: poetError } = await supabase.from('poets').select('*').eq('slug', slug).maybeSingle();
    if (poetError) throw poetError;
    if (!poet) return res.status(404).json({ error: 'Poet not found' });

    const { data: shayariCounts } = await supabase.from('shayari').select('form').eq('poet_id', poet.id);
    const countsByForm = (shayariCounts || []).reduce((acc: any, s: any) => { acc[s.form] = (acc[s.form] || 0) + 1; return acc; }, {});
    const { data: popularShayari } = await supabase.from('shayari').select('id').eq('poet_id', poet.id).order('popularity_score', { ascending: false }).limit(10);

    res.json({ ...poet, shayariCounts: countsByForm, popularShayariIds: (popularShayari || []).map((s: any) => s.id) });
  } catch (error) {
    console.error('Error fetching poet:', error);
    res.status(500).json({ error: 'Failed to fetch poet' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, slug, short_bio, long_bio, primary_language, avatar_url, country, birth_year, death_year, wordpress_id, seo_title, seo_description, seo_keywords } = req.body;

    if (!name) return res.status(400).json({ error: true, message: 'Name is required' });

    let finalSlug = slug && slug.trim() ? slug.trim() : name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/--+/g, '-').trim();

    let attempt = 0;
    let data = null;
    while (attempt < 5) {
      const currentSlug = attempt === 0 ? finalSlug : `${finalSlug}-${Math.random().toString(36).substring(2, 6)}`;
      const { data: insertData, error: insertError } = await supabase.from('poets').insert({
        name, slug: currentSlug, short_bio: short_bio || '', long_bio: long_bio || '',
        primary_language: primary_language || 'roman_urdu', avatar_url: avatar_url || '',
        country: country || '', birth_year: birth_year || null, death_year: death_year || null,
        wordpress_id: wordpress_id || null, seo_title: seo_title?.trim() || null,
        seo_description: seo_description?.trim() || null, seo_keywords: seo_keywords?.trim() || null
      }).select().single();

      if (!insertError) { data = insertData; break; }
      if (insertError.code !== '23505') throw insertError;
      attempt++;
    }

    if (!data) throw new Error('Failed to create poet after multiple attempts');
    res.status(201).json(data);
  } catch (error: any) {
    const message = error?.message || error?.hint || 'Failed to create poet';
    res.status(400).json({ error: true, message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, short_bio, long_bio, primary_language, avatar_url, country, birth_year, death_year, wordpress_id, seo_title, seo_description, seo_keywords } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (short_bio !== undefined) updateData.short_bio = short_bio;
    if (long_bio !== undefined) updateData.long_bio = long_bio;
    if (primary_language !== undefined) updateData.primary_language = primary_language;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    if (country !== undefined) updateData.country = country;
    if (birth_year !== undefined) updateData.birth_year = birth_year;
    if (death_year !== undefined) updateData.death_year = death_year;
    if (wordpress_id !== undefined) updateData.wordpress_id = wordpress_id;
    if (seo_title !== undefined) updateData.seo_title = seo_title?.trim() || null;
    if (seo_description !== undefined) updateData.seo_description = seo_description?.trim() || null;
    if (seo_keywords !== undefined) updateData.seo_keywords = seo_keywords?.trim() || null;

    const { data, error } = await supabase.from('poets').update(updateData).eq('id', id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: true, message: error?.message || 'Failed to update poet' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('poets').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: true, message: error?.message || 'Failed to delete poet' });
  }
});

export default router;
