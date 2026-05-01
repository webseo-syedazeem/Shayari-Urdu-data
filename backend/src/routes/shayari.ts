import { Router } from 'express';
import { supabase } from '../config/database';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { page = '1', pageSize = '20', language, form, topic, sort = 'latest', poetId } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    let query = supabase.from('shayari').select(`*, poets(name, slug, avatar_url), shayari_language_versions(language, text)`, { count: 'exact' });

    if (poetId) query = query.eq('poet_id', poetId);
    if (form) query = query.eq('form', form);
    if (topic) {
      const { data: topicShayari } = await supabase.from('shayari_topics').select('shayari_id').eq('topic_id', topic);
      const ids = (topicShayari || []).map((s: any) => s.shayari_id);
      if (ids.length === 0) return res.json({ data: [], pagination: { page: Number(page), pageSize: Number(pageSize), total: 0, totalPages: 0 } });
      query = query.in('id', ids);
    }

    switch (sort) {
      case 'trending': query = query.eq('is_trending', true).order('popularity_score', { ascending: false }); break;
      case 'mostLoved': query = query.order('popularity_score', { ascending: false }); break;
      default: query = query.order('created_at', { ascending: false }); break;
    }

    query = query.range(offset, offset + Number(pageSize) - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ data, pagination: { page: Number(page), pageSize: Number(pageSize), total: count || 0, totalPages: Math.ceil((count || 0) / Number(pageSize)) } });
  } catch (error) {
    console.error('Error fetching shayari:', error);
    res.status(500).json({ error: 'Failed to fetch shayari' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: shayari, error: shayariError } = await supabase.from('shayari').select(`*, poets(*)`).eq('id', id).single();
    if (shayariError) throw shayariError;
    if (!shayari) return res.status(404).json({ error: 'Shayari not found' });

    const { data: languageVersions } = await supabase.from('shayari_language_versions').select('*').eq('shayari_id', id);
    const { data: topics } = await supabase.from('shayari_topics').select('topics(*)').eq('shayari_id', id);
    const { data: tags } = await supabase.from('shayari_tags').select('tags(*)').eq('shayari_id', id);
    const { data: relatedShayari } = await supabase.from('shayari').select(`*, poets(name, slug, avatar_url), shayari_language_versions(language, text)`).eq('poet_id', shayari.poet_id).neq('id', id).limit(6);

    res.json({
      ...shayari,
      shayari_language_versions: languageVersions,
      topics: (topics || []).map((t: any) => t.topics).filter(Boolean),
      tags: (tags || []).map((t: any) => t.tags).filter(Boolean),
      relatedShayari
    });
  } catch (error) {
    console.error('Error fetching shayari:', error);
    res.status(500).json({ error: 'Failed to fetch shayari' });
  }
});

router.get('/:id/chat', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = '1', pageSize = '50' } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    const { data, error, count } = await supabase.from('chat_messages').select('*', { count: 'exact' }).eq('shayari_id', id).order('created_at', { ascending: false }).range(offset, offset + Number(pageSize) - 1);
    if (error) throw error;

    res.json({ data, pagination: { page: Number(page), pageSize: Number(pageSize), total: count || 0 } });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { poet_id, form, topics, tags, is_trending, is_featured, popularity_score, featured_image_url, featured_image_alt, wordpress_featured_image_id, languages, slug, seo_title, seo_description, seo_keywords } = req.body;

    if (!poet_id) return res.status(400).json({ error: true, message: 'poet_id is required' });

    const filteredLanguages: Record<string, string> = {};
    if (languages && typeof languages === 'object') {
      Object.entries(languages).forEach(([key, value]) => {
        if (value && typeof value === 'string' && value.trim()) filteredLanguages[key] = value;
      });
    }
    if (Object.keys(filteredLanguages).length === 0) {
      return res.status(400).json({ error: true, message: 'At least one language version with text is required' });
    }

    const { data: shayari, error: shayariError } = await supabase.from('shayari').insert({
      poet_id, form: form || 'sher', is_trending: is_trending || false,
      is_featured: is_featured || false, popularity_score: popularity_score || 0,
      featured_image_url: featured_image_url || null, featured_image_alt: featured_image_alt || null,
      wordpress_featured_image_id: wordpress_featured_image_id || null,
      slug: slug || null, seo_title: seo_title?.trim() || null,
      seo_description: seo_description?.trim() || null, seo_keywords: seo_keywords?.trim() || null
    }).select().single();

    if (shayariError) throw shayariError;

    const languageVersions = Object.entries(filteredLanguages).map(([language, text]) => ({ shayari_id: shayari.id, language, text }));
    const { error: versionsError } = await supabase.from('shayari_language_versions').insert(languageVersions);
    if (versionsError) throw versionsError;

    let topicsInserted = 0, tagsInserted = 0;

    if (topics && Array.isArray(topics) && topics.length > 0) {
      const topicLinks = topics.map((topicId: string) => ({ shayari_id: shayari.id, topic_id: topicId }));
      const { error: topicsError } = await supabase.from('shayari_topics').insert(topicLinks);
      if (topicsError) throw topicsError;
      topicsInserted = topicLinks.length;
    }

    if (tags && Array.isArray(tags) && tags.length > 0) {
      const tagLinks = tags.map((tagId: string) => ({ shayari_id: shayari.id, tag_id: tagId }));
      const { error: tagsError } = await supabase.from('shayari_tags').insert(tagLinks);
      if (tagsError) throw tagsError;
      tagsInserted = tagLinks.length;
    }

    res.status(201).json({ ...shayari, _debug: { topicsInserted, tagsInserted } });
  } catch (error: any) {
    const message = error?.message || error?.hint || error?.details || 'Unknown error while saving shayari';
    res.status(400).json({ error: true, message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { poet_id, form, topics, tags, is_trending, is_featured, popularity_score, featured_image_url, featured_image_alt, wordpress_featured_image_id, languages, slug, seo_title, seo_description, seo_keywords } = req.body;

    const updateData: any = {};
    if (poet_id !== undefined) updateData.poet_id = poet_id;
    if (form !== undefined) updateData.form = form;
    if (is_trending !== undefined) updateData.is_trending = is_trending;
    if (is_featured !== undefined) updateData.is_featured = is_featured;
    if (popularity_score !== undefined) updateData.popularity_score = popularity_score;
    if (featured_image_url !== undefined) updateData.featured_image_url = featured_image_url;
    if (featured_image_alt !== undefined) updateData.featured_image_alt = featured_image_alt;
    if (wordpress_featured_image_id !== undefined) updateData.wordpress_featured_image_id = wordpress_featured_image_id;
    if (slug !== undefined) updateData.slug = slug || null;
    if (seo_title !== undefined) updateData.seo_title = seo_title?.trim() || null;
    if (seo_description !== undefined) updateData.seo_description = seo_description?.trim() || null;
    if (seo_keywords !== undefined) updateData.seo_keywords = seo_keywords?.trim() || null;

    const { data: shayari, error: shayariError } = await supabase.from('shayari').update(updateData).eq('id', id).select().single();
    if (shayariError) throw shayariError;

    if (languages && Object.keys(languages).length > 0) {
      await supabase.from('shayari_language_versions').delete().eq('shayari_id', id);
      const languageVersions = Object.entries(languages).filter(([_, text]) => text && (text as string).trim()).map(([language, text]) => ({ shayari_id: id, language, text }));
      if (languageVersions.length > 0) {
        const { error: versionsError } = await supabase.from('shayari_language_versions').insert(languageVersions);
        if (versionsError) throw versionsError;
      }
    }

    let topicsInserted = 0, tagsInserted = 0;

    if (topics !== undefined) {
      await supabase.from('shayari_topics').delete().eq('shayari_id', id);
      if (Array.isArray(topics) && topics.length > 0) {
        const topicLinks = topics.map((topicId: string) => ({ shayari_id: id, topic_id: topicId }));
        const { error: insertTopicsError } = await supabase.from('shayari_topics').insert(topicLinks);
        if (insertTopicsError) throw insertTopicsError;
        topicsInserted = topicLinks.length;
      }
    }

    if (tags !== undefined) {
      await supabase.from('shayari_tags').delete().eq('shayari_id', id);
      if (Array.isArray(tags) && tags.length > 0) {
        const tagLinks = tags.map((tagId: string) => ({ shayari_id: id, tag_id: tagId }));
        const { error: insertTagsError } = await supabase.from('shayari_tags').insert(tagLinks);
        if (insertTagsError) throw insertTagsError;
        tagsInserted = tagLinks.length;
      }
    }

    res.json({ ...shayari, _debug: { topicsInserted, tagsInserted } });
  } catch (error: any) {
    const message = error?.message || error?.hint || 'Failed to update shayari';
    res.status(400).json({ error: true, message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await supabase.from('shayari_language_versions').delete().eq('shayari_id', id);
    await supabase.from('shayari_topics').delete().eq('shayari_id', id);
    await supabase.from('shayari_tags').delete().eq('shayari_id', id);
    const { error } = await supabase.from('shayari').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: true, message: error?.message || 'Failed to delete shayari' });
  }
});

export default router;
