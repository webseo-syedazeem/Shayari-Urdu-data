import { Router } from 'express';
import { supabase } from '../config/database';

const router = Router();

const VALID_LANGUAGES = new Set(['roman_urdu', 'urdu', 'hindi', 'english']);
const VALID_FORMS = new Set(['sher', 'ghazal', 'nazm', 'qitta', 'quote', 'rubai', 'other']);
const MOOD_TOPIC_ALIASES: Record<string, string[]> = {
  love: ['love', 'romantic'],
  sad: ['sad', 'pain', 'heartbreak', 'sorrow'],
  motivational: ['motivational', 'hope'],
  friendship: ['friendship'],
  life: ['life'],
  romantic: ['romantic', 'love'],
  philosophical: ['philosophical', 'philosophy']
};

function parsePositiveInt(value: unknown, fallback: number, max?: number) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return max ? Math.min(parsed, max) : parsed;
}

function emptyListResponse(page: number, pageSize: number) {
  return { data: [], pagination: { page, pageSize, total: 0, totalPages: 0 } };
}

function normalizeLanguage(value: unknown) {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase().replace(/[-\s]/g, '_');
  return VALID_LANGUAGES.has(normalized) ? normalized : null;
}

function normalizeForm(value: unknown) {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase();
  return VALID_FORMS.has(normalized) ? normalized : null;
}

async function resolveTopicIds(value: unknown, aliases: Record<string, string[]> = {}) {
  if (!value) return null;

  const raw = String(value).trim();
  const normalized = raw.toLowerCase().replace(/_/g, '-');
  const candidates = new Set([normalized, ...(aliases[normalized] || [])]);

  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw)) {
    return [raw];
  }

  const { data, error } = await supabase.from('topics').select('id, name, slug');
  if (error) throw error;

  return (data || [])
    .filter((topic: any) => {
      const slug = String(topic.slug || '').toLowerCase();
      const name = String(topic.name || '').trim().toLowerCase().replace(/\s+/g, '-');
      return candidates.has(slug) || candidates.has(name);
    })
    .map((topic: any) => topic.id);
}

async function getShayariDetail(column: 'id' | 'slug', value: string) {
  const { data: shayari, error: shayariError } = await supabase.from('shayari').select(`*, poets(*)`).eq(column, value).maybeSingle();
  if (shayariError) throw shayariError;
  if (!shayari) return null;

  const { data: languageVersions } = await supabase.from('shayari_language_versions').select('*').eq('shayari_id', shayari.id);
  const { data: topics } = await supabase.from('shayari_topics').select('topics(*)').eq('shayari_id', shayari.id);
  const { data: tags } = await supabase.from('shayari_tags').select('tags(*)').eq('shayari_id', shayari.id);
  const { data: relatedShayari } = await supabase.from('shayari').select(`*, poets(name, slug, avatar_url), shayari_language_versions(language, text)`).eq('poet_id', shayari.poet_id).neq('id', shayari.id).limit(6);

  return {
    ...shayari,
    shayari_language_versions: languageVersions,
    topics: (topics || []).map((t: any) => t.topics).filter(Boolean),
    tags: (tags || []).map((t: any) => t.tags).filter(Boolean),
    relatedShayari
  };
}

router.get('/', async (req, res) => {
  try {
    const { form, language, topic, mood, sort = 'latest', poetId, q, is_trending, is_featured } = req.query;
    const searchAll = String(req.query.searchAll) === 'true' && Boolean(String(q || '').trim());
    const page = parsePositiveInt(req.query.page, 1);
    const pageSize = parsePositiveInt(req.query.pageSize, 20, 1000);
    const calculatedOffset = (page - 1) * pageSize;
    const batchOffsetHeader = req.get('X-Batch-Offset');
    const batchOffset = batchOffsetHeader === undefined ? null : Number(batchOffsetHeader);
    if (batchOffset !== null && (!Number.isInteger(batchOffset) || batchOffset < 0)) {
      return res.status(400).json({ error: 'Invalid batch offset' });
    }
    // Normal pagination uses (page - 1) * pageSize. Bulk loading supplies the
    // absolute offset because its final page can have a smaller pageSize.
    const offset = batchOffset ?? calculatedOffset;
    const normalizedLanguage = normalizeLanguage(language);
    const normalizedForm = normalizeForm(form);
    const topicIds = topic ? await resolveTopicIds(topic) : null;
    const moodTopicIds = mood ? await resolveTopicIds(mood, MOOD_TOPIC_ALIASES) : null;

    if (language && !normalizedLanguage) {
      return res.status(400).json({ error: 'Invalid language filter' });
    }

    if (form && !normalizedForm) {
      return res.status(400).json({ error: 'Invalid form filter' });
    }

    if ((topic && topicIds?.length === 0) || (mood && moodTopicIds?.length === 0)) {
      return res.json(emptyListResponse(page, pageSize));
    }

    const languageSelect = normalizedLanguage
      ? 'shayari_language_versions!inner(language, text)'
      : 'shayari_language_versions(language, text)';
    const topicSelect = topic || mood ? ', shayari_topics!inner(topic_id)' : '';

    let query = supabase
      .from('shayari')
      .select(`*, poets(name, slug, avatar_url), ${languageSelect}${topicSelect}`, { count: 'exact' });

    if (poetId) query = query.eq('poet_id', poetId);
    if (normalizedForm) query = query.eq('form', normalizedForm);
    if (is_trending !== undefined) query = query.eq('is_trending', String(is_trending) === 'true');
    if (is_featured !== undefined) query = query.eq('is_featured', String(is_featured) === 'true');
    if (normalizedLanguage) query = query.eq('shayari_language_versions.language', normalizedLanguage);
    if (topicIds?.length) query = query.in('shayari_topics.topic_id', topicIds);
    if (moodTopicIds?.length) query = query.in('shayari_topics.topic_id', moodTopicIds);
    if (q) {
      const searchTerm = String(q).trim();
      if (searchTerm) {
        // Also search inside shayari_language_versions.text (actual shayari content)
        const { data: langMatches } = await supabase
          .from('shayari_language_versions')
          .select('shayari_id')
          .ilike('text', `%${searchTerm}%`);

        const langIds = [...new Set((langMatches || []).map((v: any) => v.shayari_id))];

        const textFilter = `title.ilike.*${searchTerm}*,slug.ilike.*${searchTerm}*,seo_title.ilike.*${searchTerm}*,seo_description.ilike.*${searchTerm}*`;

        if (langIds.length > 0) {
          query = query.or(`${textFilter},id.in.(${langIds.join(',')})`);
        } else {
          query = query.or(textFilter);
        }
      }
    }
    switch (sort) {
      case 'trending': query = query.eq('is_trending', true).order('popularity_score', { ascending: false }); break;
      case 'mostLoved': query = query.order('popularity_score', { ascending: false }); break;
      default: query = query.order('created_at', { ascending: false }); break;
    }
    query = query.order('id', { ascending: false });

    if (!searchAll) {
      query = query.range(offset, offset + pageSize - 1);
    }

    const { data, error, count } = await query;
    if (error?.code === 'PGRST103') {
      const totalMatch = String(error.details || '').match(/only\s+(\d+)\s+rows/i);
      const total = totalMatch ? Number(totalMatch[1]) : 0;

      return res.json({
        data: [],
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      });
    }
    if (error) throw error;

    const responsePageSize = searchAll ? (data?.length || 0) : pageSize;
    res.json({
      data,
      pagination: {
        page: searchAll ? 1 : page,
        pageSize: responsePageSize,
        total: count || 0,
        totalPages: searchAll ? ((count || 0) > 0 ? 1 : 0) : Math.ceil((count || 0) / pageSize)
      }
    });
  } catch (error) {
    console.error('Error fetching shayari:', error);
    res.status(500).json({ error: 'Failed to fetch shayari' });
  }
});

router.get('/poetry-of-the-day', async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const pageSize = parsePositiveInt(req.query.pageSize, 10, 50);
    const offset = (page - 1) * pageSize;

    const { data, error, count } = await supabase
      .from('shayari')
      .select('*, poets(name, slug, avatar_url), shayari_language_versions(language, text)', { count: 'exact' })
      .eq('is_poetry_of_the_day', true)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    res.json({
      data,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    });
  } catch (error) {
    console.error('Error fetching Poetry of the Day:', error);
    res.status(500).json({ error: 'Failed to fetch Poetry of the Day' });
  }
});

router.get('/by-slug', async (req, res) => {
  try {
    const { slug } = req.query;
    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({ error: 'Slug is required' });
    }

    const shayari = await getShayariDetail('slug', slug);
    if (!shayari) return res.status(404).json({ error: 'Shayari not found' });

    res.json(shayari);
  } catch (error) {
    console.error('Error fetching shayari by slug:', error);
    res.status(500).json({ error: 'Failed to fetch shayari' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const shayari = await getShayariDetail('id', id);
    if (!shayari) return res.status(404).json({ error: 'Shayari not found' });

    res.json(shayari);
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
    const { poet_id, form, topics, tags, is_trending, is_featured, is_poetry_of_the_day, popularity_score, featured_image_url, featured_image_alt, wordpress_featured_image_id, languages, slug, seo_title, seo_description, seo_keywords } = req.body;

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
      is_featured: is_featured || false,
      is_poetry_of_the_day: is_poetry_of_the_day || false,
      popularity_score: popularity_score || 0,
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
    const { poet_id, form, topics, tags, is_trending, is_featured, is_poetry_of_the_day, popularity_score, featured_image_url, featured_image_alt, wordpress_featured_image_id, languages, slug, seo_title, seo_description, seo_keywords } = req.body;

    const updateData: any = {};
    if (poet_id !== undefined) updateData.poet_id = poet_id;
    if (form !== undefined) updateData.form = form;
    if (is_trending !== undefined) updateData.is_trending = is_trending;
    if (is_featured !== undefined) updateData.is_featured = is_featured;
    if (is_poetry_of_the_day !== undefined) updateData.is_poetry_of_the_day = is_poetry_of_the_day;
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
