import { Router } from 'express';
import { supabase } from '../config/database';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('tags').select('*').order('name');
    if (error) throw error;

    const tagsWithCounts = await Promise.all(
      (data || []).map(async (tag) => {
        const { count } = await supabase.from('shayari_tags').select('*', { count: 'exact', head: true }).eq('tag_id', tag.id);
        return { ...tag, count: count || 0 };
      })
    );
    res.json({ data: tagsWithCounts });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

router.get('/by-id/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('tags').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Tag not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tag' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { page = '1', pageSize = '20' } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    const { data: tag, error: tagError } = await supabase.from('tags').select('*').eq('slug', slug).single();
    if (tagError) throw tagError;
    if (!tag) return res.status(404).json({ error: 'Tag not found' });

    const { data: shayariIds } = await supabase.from('shayari_tags').select('shayari_id').eq('tag_id', tag.id);
    const ids = (shayariIds || []).map((s: any) => s.shayari_id);

    if (ids.length === 0) {
      return res.json({ ...tag, shayari: [], pagination: { page: 1, pageSize: Number(pageSize), total: 0, totalPages: 0 } });
    }

    const { data: shayari, error: shayariError, count } = await supabase.from('shayari').select(`*, poets(name, slug, avatar_url), shayari_language_versions(language, text)`, { count: 'exact' }).in('id', ids).order('created_at', { ascending: false }).range(offset, offset + Number(pageSize) - 1);
    if (shayariError) throw shayariError;

    res.json({ ...tag, shayari, pagination: { page: Number(page), pageSize: Number(pageSize), total: count || 0, totalPages: Math.ceil((count || 0) / Number(pageSize)) } });
  } catch (error) {
    console.error('Error fetching tag:', error);
    res.status(500).json({ error: 'Failed to fetch tag' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, slug, description, seo_title, seo_description, seo_keywords } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    let finalSlug = slug || name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/--+/g, '-').trim();

    for (let attempt = 0; attempt < 5; attempt++) {
      const currentSlug = attempt === 0 ? finalSlug : `${finalSlug}-${Math.random().toString(36).substring(2, 6)}`;
      const { data, error } = await supabase.from('tags').insert({
        name, slug: currentSlug, description: description || null,
        seo_title: seo_title?.trim() || null, seo_description: seo_description?.trim() || null, seo_keywords: seo_keywords?.trim() || null
      }).select().single();

      if (!error) return res.status(201).json(data);
      if (error.code !== '23505') throw error;
    }
    throw new Error('Failed to create tag: slug already exists');
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create tag' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, seo_title, seo_description, seo_keywords } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (seo_title !== undefined) updateData.seo_title = seo_title?.trim() || null;
    if (seo_description !== undefined) updateData.seo_description = seo_description?.trim() || null;
    if (seo_keywords !== undefined) updateData.seo_keywords = seo_keywords?.trim() || null;

    const { data, error } = await supabase.from('tags').update(updateData).eq('id', id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update tag' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await supabase.from('shayari_tags').delete().eq('tag_id', id);
    const { error } = await supabase.from('tags').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete tag' });
  }
});

export default router;
