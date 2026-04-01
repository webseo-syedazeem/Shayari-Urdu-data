import { Router } from 'express';
import { supabase } from '../config/database';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name');

    if (error) throw error;

    const tagsWithCounts = await Promise.all(
      (data || []).map(async (tag) => {
        const { count } = await supabase
          .from('shayari_tags')
          .select('*', { count: 'exact', head: true })
          .eq('tag_id', tag.id);

        return { ...tag, count: count || 0 };
      })
    );

    res.json({ data: tagsWithCounts });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { page = '1', pageSize = '20' } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    const { data: tag, error: tagError } = await supabase
      .from('tags')
      .select('*')
      .eq('slug', slug)
      .single();

    if (tagError) throw tagError;
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    const { data: shayariIds } = await supabase
      .from('shayari_tags')
      .select('shayari_id')
      .eq('tag_id', tag.id);

    const ids = (shayariIds || []).map((s: any) => s.shayari_id);

    if (ids.length === 0) {
      return res.json({
        ...tag,
        shayari: [],
        pagination: { page: 1, pageSize: Number(pageSize), total: 0, totalPages: 0 }
      });
    }

    const { data: shayari, error: shayariError, count } = await supabase
      .from('shayari')
      .select(`
        *,
        poets(name, slug, avatar_url),
        shayari_language_versions(language, text)
      `, { count: 'exact' })
      .in('id', ids)
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(pageSize) - 1);

    if (shayariError) throw shayariError;

    res.json({
      ...tag,
      shayari,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(pageSize))
      }
    });
  } catch (error) {
    console.error('Error fetching tag:', error);
    res.status(500).json({ error: 'Failed to fetch tag' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, slug, description, seo_title, seo_description, seo_keywords } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const finalSlug = slug || name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();

    const { data, error } = await supabase
      .from('tags')
      .insert({
        name,
        slug: finalSlug,
        description,
        seo_title,
        seo_description,
        seo_keywords
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({ error: 'Failed to create tag' });
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
    if (seo_title !== undefined) updateData.seo_title = seo_title;
    if (seo_description !== undefined) updateData.seo_description = seo_description;
    if (seo_keywords !== undefined) updateData.seo_keywords = seo_keywords;

    const { data, error } = await supabase
      .from('tags')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error updating tag:', error);
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await supabase
      .from('shayari_tags')
      .delete()
      .eq('tag_id', id);

    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

export default router;
