import { Router } from 'express';
import { supabase } from '../config/database';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { activeOnly, placement, pageScope } = req.query;

    let query = supabase.from('ad_slots').select('*');

    if (activeOnly === 'true') query = query.eq('is_active', true);
    if (placement) query = query.eq('placement', placement);
    if (pageScope) query = query.or(`page_scope.eq.${pageScope},page_scope.eq.global`);

    if (placement || pageScope) {
      query = query.order('priority', { ascending: false }).limit(1);
    } else {
      query = query.order('key');
    }

    const { data, error } = await query;
    if (error) throw error;

    if (placement || pageScope) {
      res.json(data?.[0] || null);
    } else {
      res.json({ data });
    }
  } catch (error) {
    console.error('Error fetching ad slots:', error);
    res.status(500).json({ error: 'Failed to fetch ad slots' });
  }
});

router.get('/by-id/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('ad_slots').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Ad slot not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ad slot' });
  }
});

router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { data, error } = await supabase.from('ad_slots').select('*').eq('key', key).single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Ad slot not found' });
    res.json(data);
  } catch (error) {
    console.error('Error fetching ad slot:', error);
    res.status(500).json({ error: 'Failed to fetch ad slot' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { key, title, description, placement, page_scope, is_active, priority, frequency, html_snippet } = req.body;
    if (!key) return res.status(400).json({ error: 'Key is required' });
    if (!placement) return res.status(400).json({ error: 'Placement is required' });
    if (!page_scope) return res.status(400).json({ error: 'Page scope is required' });

    const { data, error } = await supabase.from('ad_slots').insert({
      key, title: title || '', description: description || null,
      placement, page_scope, is_active: is_active !== undefined ? is_active : true,
      priority: priority !== undefined ? priority : 100, frequency: frequency !== undefined ? frequency : 6,
      html_snippet: html_snippet || null
    }).select().single();

    if (error) {
      if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
        return res.status(400).json({ error: 'Ad slot key already exists' });
      }
      throw error;
    }
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create ad slot' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { key, title, description, placement, page_scope, is_active, priority, frequency, html_snippet } = req.body;

    const updateData: any = {};
    if (key !== undefined) updateData.key = key;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (placement !== undefined) updateData.placement = placement;
    if (page_scope !== undefined) updateData.page_scope = page_scope;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (priority !== undefined) updateData.priority = priority;
    if (frequency !== undefined) updateData.frequency = frequency;
    if (html_snippet !== undefined) updateData.html_snippet = html_snippet;

    const { data, error } = await supabase.from('ad_slots').update(updateData).eq('id', id).select().single();
    if (error) {
      if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
        return res.status(400).json({ error: 'Ad slot key already exists' });
      }
      throw error;
    }
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update ad slot' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('ad_slots').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete ad slot' });
  }
});

export default router;
