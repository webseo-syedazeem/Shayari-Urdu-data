import { Router } from 'express';
import { supabase } from '../config/database';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { page = '1', pageSize = '20' } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    const { data, error, count } = await supabase.from('collections').select('*, collection_items(count)', { count: 'exact' }).order('created_at', { ascending: false }).range(offset, offset + Number(pageSize) - 1);
    if (error) throw error;

    const collectionsWithCounts = (data || []).map(({ collection_items, ...collection }: any) => ({
      ...collection,
      itemCount: Number(collection_items?.[0]?.count || 0),
    }));

    res.json({ data: collectionsWithCounts, pagination: { page: Number(page), pageSize: Number(pageSize), total: count || 0, totalPages: Math.ceil((count || 0) / Number(pageSize)) } });
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

router.get('/by-id/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: collection, error } = await supabase.from('collections').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!collection) return res.status(404).json({ error: 'Collection not found' });

    const { data: items } = await supabase.from('collection_items').select(`*, shayari(*, poets(name, slug, avatar_url), shayari_language_versions(language, text))`).eq('collection_id', id).order('sort_order');

    res.json({ ...collection, items: (items || []).map((item: any) => item.shayari).filter(Boolean) });
  } catch (error) {
    console.error('Error fetching collection by id:', error);
    res.status(500).json({ error: 'Failed to fetch collection' });
  }
});

// GET /:id/items must come before /:slug
router.get('/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = '1', pageSize = '50' } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    const { data, error, count } = await supabase.from('collection_items').select(`id, sort_order, shayari:shayari_id (id, form, is_featured, poets(name), shayari_language_versions(language, text))`, { count: 'exact' }).eq('collection_id', id).order('sort_order').range(offset, offset + Number(pageSize) - 1);

    if (error) throw error;
    res.json({ data: data || [], total: count || 0 });
  } catch (error: any) {
    console.error('Error fetching collection items:', error);
    res.status(500).json({ error: 'Failed to fetch collection items' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { page = '1', pageSize = '50' } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    const { data: collection, error: collectionError } = await supabase.from('collections').select('*').eq('slug', slug).single();
    if (collectionError) throw collectionError;
    if (!collection) return res.status(404).json({ error: 'Collection not found' });

    const { data: items, error: itemsError, count } = await supabase.from('collection_items').select(`*, shayari(*, poets(name, slug, avatar_url), shayari_language_versions(language, text))`, { count: 'exact' }).eq('collection_id', collection.id).order('sort_order').range(offset, offset + Number(pageSize) - 1);
    if (itemsError) throw itemsError;

    res.json({ ...collection, items: (items || []).map((item: any) => item.shayari), pagination: { page: Number(page), pageSize: Number(pageSize), total: count || 0, totalPages: Math.ceil((count || 0) / Number(pageSize)) } });
  } catch (error) {
    console.error('Error fetching collection:', error);
    res.status(500).json({ error: 'Failed to fetch collection' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, slug, description, cover_image, is_featured, seo_title, seo_description, seo_keywords } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    let finalSlug = slug || title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/--+/g, '-').trim();

    for (let attempt = 0; attempt < 5; attempt++) {
      const currentSlug = attempt === 0 ? finalSlug : `${finalSlug}-${Math.random().toString(36).substring(2, 6)}`;
      const { data, error } = await supabase.from('collections').insert({
        title, slug: currentSlug, description: description || null,
        cover_image: cover_image || null, is_featured: is_featured || false,
        seo_title: seo_title?.trim() || null, seo_description: seo_description?.trim() || null, seo_keywords: seo_keywords?.trim() || null
      }).select().single();

      if (!error) return res.status(201).json(data);
      if (error.code !== '23505') throw error;
    }
    throw new Error('Failed to create collection: slug already exists');
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create collection' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, description, cover_image, is_featured, seo_title, seo_description, seo_keywords } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (cover_image !== undefined) updateData.cover_image = cover_image;
    if (is_featured !== undefined) updateData.is_featured = is_featured;
    if (seo_title !== undefined) updateData.seo_title = seo_title?.trim() || null;
    if (seo_description !== undefined) updateData.seo_description = seo_description?.trim() || null;
    if (seo_keywords !== undefined) updateData.seo_keywords = seo_keywords?.trim() || null;

    const { data, error } = await supabase.from('collections').update(updateData).eq('id', id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update collection' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await supabase.from('collection_items').delete().eq('collection_id', id);
    const { error } = await supabase.from('collections').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete collection' });
  }
});

router.post('/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    const { shayari_id, sort_order } = req.body;
    if (!shayari_id) return res.status(400).json({ error: 'shayari_id is required' });

    let finalSortOrder = sort_order;
    if (finalSortOrder === undefined) {
      const { data: maxSort } = await supabase.from('collection_items').select('sort_order').eq('collection_id', id).order('sort_order', { ascending: false }).limit(1).maybeSingle();
      finalSortOrder = (maxSort?.sort_order || 0) + 1;
    }

    const { data, error } = await supabase.from('collection_items').insert({ collection_id: id, shayari_id, sort_order: finalSortOrder }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to add item to collection' });
  }
});

router.post('/:id/items/bulk', async (req, res) => {
  try {
    const { id } = req.params;
    const { shayari_ids } = req.body;
    if (!Array.isArray(shayari_ids) || shayari_ids.length === 0) {
      return res.status(400).json({ error: 'shayari_ids array required' });
    }

    const { data: maxSort } = await supabase.from('collection_items').select('sort_order').eq('collection_id', id).order('sort_order', { ascending: false }).limit(1).maybeSingle();
    let startOrder = (maxSort?.sort_order || 0) + 1;

    const chunkSize = 100;
    let allInserted = 0;
    let skipped = 0;

    for (let i = 0; i < shayari_ids.length; i += chunkSize) {
      const chunk = shayari_ids.slice(i, i + chunkSize);
      const items = chunk.map((shayariId: string, index: number) => ({
        collection_id: id, shayari_id: shayariId, sort_order: startOrder + i + index
      }));

      const { data, error } = await supabase.from('collection_items').insert(items).select();
      if (error) {
        if (error.code === '23505') { skipped += chunk.length; continue; }
        throw error;
      }
      allInserted += data?.length || 0;
    }

    res.json({ inserted: allInserted, skipped });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to bulk add items' });
  }
});

router.post('/:id/items/reorder', async (req, res) => {
  try {
    const { id } = req.params;
    const { item_ids } = req.body;
    if (!Array.isArray(item_ids)) return res.status(400).json({ error: 'item_ids array required' });

    for (let index = 0; index < item_ids.length; index++) {
      const { error } = await supabase.from('collection_items').update({ sort_order: index }).eq('id', item_ids[index]).eq('collection_id', id);
      if (error) throw error;
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to reorder items' });
  }
});

router.delete('/items/bulk', async (req, res) => {
  try {
    const { item_ids } = req.body;
    if (!Array.isArray(item_ids) || item_ids.length === 0) {
      return res.status(400).json({ error: 'item_ids array required' });
    }
    const { error } = await supabase.from('collection_items').delete().in('id', item_ids);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to bulk remove items' });
  }
});

router.delete('/items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { error } = await supabase.from('collection_items').delete().eq('id', itemId);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete collection item' });
  }
});

export default router;
