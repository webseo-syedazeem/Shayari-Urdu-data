import { Router } from 'express';
import { supabase } from '../config/database';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { page = '1', pageSize = '20', search = '' } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    let query = supabase
      .from('poets')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    query = query
      .order('name')
      .range(offset, offset + Number(pageSize) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      data,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(pageSize))
      }
    });
  } catch (error) {
    console.error('Error fetching poets:', error);
    res.status(500).json({ error: 'Failed to fetch poets' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const { data: poet, error: poetError } = await supabase
      .from('poets')
      .select('*')
      .eq('slug', slug)
      .single();

    if (poetError) throw poetError;
    if (!poet) {
      return res.status(404).json({ error: 'Poet not found' });
    }

    const { data: shayariCounts } = await supabase
      .from('shayari')
      .select('form')
      .eq('poet_id', poet.id);

    const countsByForm = (shayariCounts || []).reduce((acc: any, s: any) => {
      acc[s.form] = (acc[s.form] || 0) + 1;
      return acc;
    }, {});

    const { data: popularShayari } = await supabase
      .from('shayari')
      .select('id')
      .eq('poet_id', poet.id)
      .order('popularity_score', { ascending: false })
      .limit(10);

    res.json({
      ...poet,
      shayariCounts: countsByForm,
      popularShayariIds: (popularShayari || []).map((s: any) => s.id)
    });
  } catch (error) {
    console.error('Error fetching poet:', error);
    res.status(500).json({ error: 'Failed to fetch poet' });
  }
});

router.post('/', async (req, res) => {
  try {
    console.log('DEBUG POST /api/poets body:', req.body);

    const {
      name,
      slug,
      short_bio,
      long_bio,
      primary_language,
      avatar_url,
      country,
      birth_year,
      death_year,
      wordpress_id
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: true, message: 'Name is required' });
    }

    // Auto-generate slug if missing or empty
    let finalSlug = slug && slug.trim() ? slug.trim() : name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();

    // Try to insert with generated slug, handle duplicates
    let attempt = 0;
    let insertSuccess = false;
    let data = null;
    let lastError = null;

    while (attempt < 5 && !insertSuccess) {
      const currentSlug = attempt === 0 ? finalSlug : `${finalSlug}-${Math.random().toString(36).substring(2, 6)}`;

      const { data: insertData, error: insertError } = await supabase
        .from('poets')
        .insert({
          name,
          slug: currentSlug,
          short_bio: short_bio || '',
          long_bio: long_bio || '',
          primary_language: primary_language || 'roman_urdu',
          avatar_url: avatar_url || '',
          country: country || '',
          birth_year: birth_year || null,
          death_year: death_year || null,
          wordpress_id: wordpress_id || null
        })
        .select()
        .single();

      if (!insertError) {
        insertSuccess = true;
        data = insertData;
      } else if (insertError.code === '23505') {
        // Duplicate key, try again with suffix
        attempt++;
        lastError = insertError;
      } else {
        // Other error, throw immediately
        throw insertError;
      }
    }

    if (!insertSuccess) {
      throw lastError || new Error('Failed to create poet after multiple attempts');
    }

    console.log('DEBUG POST /api/poets success:', data);
    res.status(201).json(data);
  } catch (error: any) {
    console.error('ERROR POST /api/poets:', error);
    const message = error?.message || error?.hint || error?.details || 'Unknown error while saving poet';
    res.status(400).json({ error: true, message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      short_bio,
      long_bio,
      primary_language,
      avatar_url,
      country,
      birth_year,
      death_year,
      wordpress_id
    } = req.body;

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

    const { data, error } = await supabase
      .from('poets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error: any) {
    console.error('Error updating poet:', error);
    const message = error?.message || error?.hint || 'Failed to update poet';
    res.status(400).json({ error: true, message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('poets')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting poet:', error);
    const message = error?.message || error?.hint || 'Failed to delete poet';
    res.status(400).json({ error: true, message });
  }
});

export default router;
