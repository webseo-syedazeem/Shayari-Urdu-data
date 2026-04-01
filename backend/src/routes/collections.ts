import { Router } from 'express';
import { supabase } from '../config/database';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { page = '1', pageSize = '20' } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    const { data, error, count } = await supabase
      .from('collections')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(pageSize) - 1);

    if (error) throw error;

    const collectionsWithCounts = await Promise.all(
      (data || []).map(async (collection) => {
        const { count } = await supabase
          .from('collection_items')
          .select('*', { count: 'exact', head: true })
          .eq('collection_id', collection.id);

        return { ...collection, itemCount: count || 0 };
      })
    );

    res.json({
      data: collectionsWithCounts,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(pageSize))
      }
    });
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { page = '1', pageSize = '50' } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('*')
      .eq('slug', slug)
      .single();

    if (collectionError) throw collectionError;
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const { data: items, error: itemsError, count } = await supabase
      .from('collection_items')
      .select(`
        *,
        shayari (
          *,
          poets(name, slug, avatar_url),
          shayari_language_versions(language, text)
        )
      `, { count: 'exact' })
      .eq('collection_id', collection.id)
      .order('sort_order')
      .range(offset, offset + Number(pageSize) - 1);

    if (itemsError) throw itemsError;

    res.json({
      ...collection,
      items: (items || []).map((item: any) => item.shayari),
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(pageSize))
      }
    });
  } catch (error) {
    console.error('Error fetching collection:', error);
    res.status(500).json({ error: 'Failed to fetch collection' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, slug, description, cover_image, is_featured } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const finalSlug = slug || title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();

    const { data, error } = await supabase
      .from('collections')
      .insert({
        title,
        slug: finalSlug,
        description,
        cover_image,
        is_featured: is_featured || false
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating collection:', error);
    res.status(500).json({ error: 'Failed to create collection' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, description, cover_image, is_featured } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (cover_image !== undefined) updateData.cover_image = cover_image;
    if (is_featured !== undefined) updateData.is_featured = is_featured;

    const { data, error } = await supabase
      .from('collections')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error updating collection:', error);
    res.status(500).json({ error: 'Failed to update collection' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await supabase
      .from('collection_items')
      .delete()
      .eq('collection_id', id);

    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ error: 'Failed to delete collection' });
  }
});

router.post('/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    const { shayari_id, sort_order } = req.body;

    if (!shayari_id) {
      return res.status(400).json({ error: 'shayari_id is required' });
    }

    const { data, error } = await supabase
      .from('collection_items')
      .insert({
        collection_id: id,
        shayari_id,
        sort_order: sort_order || 0
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Error adding item to collection:', error);
    res.status(500).json({ error: 'Failed to add item to collection' });
  }
});

router.put('/items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { sort_order } = req.body;

    const updateData: any = {};
    if (sort_order !== undefined) updateData.sort_order = sort_order;

    const { data, error } = await supabase
      .from('collection_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error updating collection item:', error);
    res.status(500).json({ error: 'Failed to update collection item' });
  }
});

router.delete('/items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;

    const { error } = await supabase
      .from('collection_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting collection item:', error);
    res.status(500).json({ error: 'Failed to delete collection item' });
  }
});

export default router;
