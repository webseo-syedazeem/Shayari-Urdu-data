import { Router } from 'express';
import { supabase } from '../config/database';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { page = '1', pageSize = '20', poetId } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    let query = supabase
      .from('ebooks')
      .select('*', { count: 'exact' });

    if (poetId) {
      query = query.eq('poet_id', poetId);
    }

    query = query
      .order('created_at', { ascending: false })
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
    console.error('Error fetching ebooks:', error);
    res.status(500).json({ error: 'Failed to fetch ebooks' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const { data, error } = await supabase
      .from('ebooks')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Ebook not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching ebook:', error);
    res.status(500).json({ error: 'Failed to fetch ebook' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      slug,
      poet_id,
      titles,
      descriptions,
      cover_image,
      file_url_pdf,
      file_url_epub
    } = req.body;

    if (!slug) {
      return res.status(400).json({ error: 'Slug is required' });
    }

    const { data, error } = await supabase
      .from('ebooks')
      .insert({
        slug,
        poet_id,
        titles: titles || {},
        descriptions: descriptions || {},
        cover_image,
        file_url_pdf,
        file_url_epub
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating ebook:', error);
    res.status(500).json({ error: 'Failed to create ebook' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      slug,
      poet_id,
      titles,
      descriptions,
      cover_image,
      file_url_pdf,
      file_url_epub
    } = req.body;

    const updateData: any = {};
    if (slug !== undefined) updateData.slug = slug;
    if (poet_id !== undefined) updateData.poet_id = poet_id;
    if (titles !== undefined) updateData.titles = titles;
    if (descriptions !== undefined) updateData.descriptions = descriptions;
    if (cover_image !== undefined) updateData.cover_image = cover_image;
    if (file_url_pdf !== undefined) updateData.file_url_pdf = file_url_pdf;
    if (file_url_epub !== undefined) updateData.file_url_epub = file_url_epub;

    const { data, error } = await supabase
      .from('ebooks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error updating ebook:', error);
    res.status(500).json({ error: 'Failed to update ebook' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('ebooks')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting ebook:', error);
    res.status(500).json({ error: 'Failed to delete ebook' });
  }
});

export default router;
