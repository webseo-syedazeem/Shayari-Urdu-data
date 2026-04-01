import { Router } from 'express';
import { supabase } from '../config/database';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { activeOnly } = req.query;

    let query = supabase
      .from('ad_slots')
      .select('*');

    if (activeOnly === 'true') {
      query = query.eq('is_active', true);
    }

    query = query.order('key');

    const { data, error } = await query;

    if (error) throw error;

    res.json({ data });
  } catch (error) {
    console.error('Error fetching ad slots:', error);
    res.status(500).json({ error: 'Failed to fetch ad slots' });
  }
});

router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;

    const { data, error } = await supabase
      .from('ad_slots')
      .select('*')
      .eq('key', key)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Ad slot not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching ad slot:', error);
    res.status(500).json({ error: 'Failed to fetch ad slot' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { key, title, description, is_active, html_snippet } = req.body;

    if (!key) {
      return res.status(400).json({ error: 'Key is required' });
    }

    const { data, error } = await supabase
      .from('ad_slots')
      .insert({
        key,
        title,
        description,
        is_active: is_active || false,
        html_snippet
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating ad slot:', error);
    res.status(500).json({ error: 'Failed to create ad slot' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { key, title, description, is_active, html_snippet } = req.body;

    const updateData: any = {};
    if (key !== undefined) updateData.key = key;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (html_snippet !== undefined) updateData.html_snippet = html_snippet;

    const { data, error } = await supabase
      .from('ad_slots')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error updating ad slot:', error);
    res.status(500).json({ error: 'Failed to update ad slot' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('ad_slots')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting ad slot:', error);
    res.status(500).json({ error: 'Failed to delete ad slot' });
  }
});

export default router;
