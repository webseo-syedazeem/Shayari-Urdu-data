import { Router } from 'express';
import { supabase } from '../config/database';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { page = '1', pageSize = '20', poetId } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    let query = supabase.from('ebooks').select('*', { count: 'exact' });
    if (poetId) query = query.eq('poet_id', poetId);
    query = query.order('created_at', { ascending: false }).range(offset, offset + Number(pageSize) - 1);

    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ data, pagination: { page: Number(page), pageSize: Number(pageSize), total: count || 0, totalPages: Math.ceil((count || 0) / Number(pageSize)) } });
  } catch (error) {
    console.error('Error fetching ebooks:', error);
    res.status(500).json({ error: 'Failed to fetch ebooks' });
  }
});

router.get('/by-id/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('ebooks').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Ebook not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ebook' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { data, error } = await supabase.from('ebooks').select('*').eq('slug', slug).single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Ebook not found' });
    res.json(data);
  } catch (error) {
    console.error('Error fetching ebook:', error);
    res.status(500).json({ error: 'Failed to fetch ebook' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { slug, poet_id, poet_name, titles, descriptions, cover_image, pages, file_url_pdf, file_url_epub, seo_title, seo_description, seo_keywords } = req.body;
    if (!slug) return res.status(400).json({ error: 'Slug is required' });

    const { data, error } = await supabase.from('ebooks').insert({
      slug, poet_id: poet_id || null, poet_name: poet_name || null,
      titles: titles || {}, descriptions: descriptions || {},
      cover_image: cover_image || null, pages: pages || 0,
      file_url_pdf: file_url_pdf || null, file_url_epub: file_url_epub || null,
      seo_title: seo_title?.trim() || null, seo_description: seo_description?.trim() || null, seo_keywords: seo_keywords?.trim() || null
    }).select().single();

    if (error) {
      if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
        return res.status(400).json({ error: 'Slug already exists' });
      }
      throw error;
    }
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create ebook' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { slug, poet_id, poet_name, titles, descriptions, cover_image, pages, file_url_pdf, file_url_epub, seo_title, seo_description, seo_keywords } = req.body;

    const updateData: any = {};
    if (slug !== undefined) updateData.slug = slug;
    if (poet_id !== undefined) updateData.poet_id = poet_id || null;
    if (poet_name !== undefined) updateData.poet_name = poet_name || null;
    if (titles !== undefined) updateData.titles = titles;
    if (descriptions !== undefined) updateData.descriptions = descriptions;
    if (cover_image !== undefined) updateData.cover_image = cover_image || null;
    if (pages !== undefined) updateData.pages = pages;
    if (file_url_pdf !== undefined) updateData.file_url_pdf = file_url_pdf || null;
    if (file_url_epub !== undefined) updateData.file_url_epub = file_url_epub || null;
    if (seo_title !== undefined) updateData.seo_title = seo_title?.trim() || null;
    if (seo_description !== undefined) updateData.seo_description = seo_description?.trim() || null;
    if (seo_keywords !== undefined) updateData.seo_keywords = seo_keywords?.trim() || null;

    const { data, error } = await supabase.from('ebooks').update(updateData).eq('id', id).select().single();
    if (error) {
      if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
        return res.status(400).json({ error: 'Slug already exists' });
      }
      throw error;
    }
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update ebook' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('ebooks').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete ebook' });
  }
});

export default router;
