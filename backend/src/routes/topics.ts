import { Router } from 'express';
import { supabase } from '../config/database';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .order('name');

    if (error) throw error;

    const topicsWithCounts = await Promise.all(
      (data || []).map(async (topic) => {
        const { count } = await supabase
          .from('shayari_topics')
          .select('*', { count: 'exact', head: true })
          .eq('topic_id', topic.id);

        return { ...topic, count: count || 0 };
      })
    );

    res.json({ data: topicsWithCounts });
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { page = '1', pageSize = '20' } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select('*')
      .eq('slug', slug)
      .single();

    if (topicError) throw topicError;
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const { data: shayariIds } = await supabase
      .from('shayari_topics')
      .select('shayari_id')
      .eq('topic_id', topic.id);

    const ids = (shayariIds || []).map((s: any) => s.shayari_id);

    if (ids.length === 0) {
      return res.json({
        ...topic,
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
      ...topic,
      shayari,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(pageSize))
      }
    });
  } catch (error) {
    console.error('Error fetching topic:', error);
    res.status(500).json({ error: 'Failed to fetch topic' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, slug, description } = req.body;

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
      .from('topics')
      .insert({
        name,
        slug: finalSlug,
        description
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating topic:', error);
    res.status(500).json({ error: 'Failed to create topic' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;

    const { data, error } = await supabase
      .from('topics')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error updating topic:', error);
    res.status(500).json({ error: 'Failed to update topic' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await supabase
      .from('shayari_topics')
      .delete()
      .eq('topic_id', id);

    const { error } = await supabase
      .from('topics')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting topic:', error);
    res.status(500).json({ error: 'Failed to delete topic' });
  }
});

export default router;
