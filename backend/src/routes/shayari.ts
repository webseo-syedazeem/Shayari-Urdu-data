import { createHash, randomUUID } from 'crypto';
import { Router, Request } from 'express';
import { supabase } from '../config/database';
import { buildKey, cacheAside, cacheGet, cacheSet, getDirtyIds, getVersion, publishDirtyWrite } from '../config/redis';
import { CachedRecord, persistShayari } from '../services/cachePersistence';
import { enqueuePersistence } from '../services/persistenceQueue';

const router = Router();

router.use((req, res, next) => {
  const start = Date.now();
  const originalEnd = res.end;
  (res as any).end = function (...args: any[]) {
    if (!res.headersSent) res.setHeader('X-Response-Time', `${Date.now() - start}ms`);
    return originalEnd.apply(res, args as any);
  };
  res.on('finish', () => {
    const elapsed = Date.now() - start;
    const cacheStatus = res.getHeader('X-Cache');
    if (cacheStatus === 'HIT') console.log(`[cache] HIT  ${req.originalUrl}  (${elapsed}ms)`);
    if (cacheStatus === 'MISS') console.log(`[cache] MISS ${req.originalUrl}  db=${elapsed}ms`);
    console.log(`[timing] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${elapsed}ms)`);
  });
  next();
});
const ITEM_TTL = 1800;
const WRITE_TTL = 1800;
const LIST_TTL = 600;

const VALID_LANGUAGES = new Set(['roman_urdu', 'urdu', 'hindi', 'english']);
const VALID_FORMS = new Set(['sher', 'ghazal', 'nazm', 'qitta', 'quote', 'rubai', 'other']);
const MOOD_TOPIC_ALIASES: Record<string, string[]> = {
  love: ['love', 'romantic'], sad: ['sad', 'pain', 'heartbreak', 'sorrow'],
  motivational: ['motivational', 'hope'], friendship: ['friendship'], life: ['life'],
  romantic: ['romantic', 'love'], philosophical: ['philosophical', 'philosophy']
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

function requestHash(req: Request) {
  const query = Object.entries(req.query)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${Array.isArray(value) ? value.join(',') : String(value)}`)
    .join('&');
  return createHash('sha256').update(`${query}|batch=${req.get('X-Batch-Offset') || ''}`).digest('base64url').slice(0, 24);
}

function publicValue(value: CachedRecord) {
  const { languages, topic_ids, tag_ids, _deleted, _revision, _pendingCreate, ...visible } = value;
  return visible;
}

function languageMap(value: CachedRecord): Record<string, string> {
  if (value.languages && typeof value.languages === 'object') return value.languages;
  return Object.fromEntries((value.shayari_language_versions || []).map((item: any) => [item.language, item.text]));
}

function relationIds(value: CachedRecord, field: 'topics' | 'tags', internalField: 'topic_ids' | 'tag_ids'): string[] {
  if (Array.isArray(value[internalField])) return value[internalField];
  return Array.isArray(value[field]) ? value[field].map((item: any) => typeof item === 'string' ? item : item?.id).filter(Boolean) : [];
}

async function resolveTopicIds(value: unknown, aliases: Record<string, string[]> = {}) {
  if (!value) return null;
  const raw = String(value).trim();
  const normalized = raw.toLowerCase().replace(/_/g, '-');
  const candidates = new Set([normalized, ...(aliases[normalized] || [])]);
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw)) return [raw];
  const { data, error } = await supabase.from('topics').select('id, name, slug');
  if (error) throw error;
  return (data || []).filter((topic: any) => {
    const slug = String(topic.slug || '').toLowerCase();
    const name = String(topic.name || '').trim().toLowerCase().replace(/\s+/g, '-');
    return candidates.has(slug) || candidates.has(name);
  }).map((topic: any) => topic.id);
}

async function getShayariDetail(column: 'id' | 'slug', value: string) {
  const { data: shayari, error: shayariError } = await supabase.from('shayari').select('*, poets(*)').eq(column, value).maybeSingle();
  if (shayariError) throw shayariError;
  if (!shayari) return null;
  const [{ data: languageVersions }, { data: topics }, { data: tags }, { data: relatedShayari }] = await Promise.all([
    supabase.from('shayari_language_versions').select('*').eq('shayari_id', shayari.id),
    supabase.from('shayari_topics').select('topics(*)').eq('shayari_id', shayari.id),
    supabase.from('shayari_tags').select('tags(*)').eq('shayari_id', shayari.id),
    supabase.from('shayari').select('*, poets(name, slug, avatar_url), shayari_language_versions(language, text)').eq('poet_id', shayari.poet_id).neq('id', shayari.id).limit(6)
  ]);
  return {
    ...shayari,
    shayari_language_versions: languageVersions,
    topics: (topics || []).map((item: any) => item.topics).filter(Boolean),
    tags: (tags || []).map((item: any) => item.tags).filter(Boolean),
    relatedShayari
  } as CachedRecord;
}

async function cachedDetail(column: 'id' | 'slug', value: string) {
  return cacheGet<CachedRecord>(buildKey('shayari', column === 'id' ? 'item' : 'slug', value));
}

async function getPendingShayari(): Promise<CachedRecord[]> {
  const ids = await getDirtyIds('shayari');
  const values = await Promise.all(ids.map((id) => cacheGet<CachedRecord>(buildKey('shayari', 'item', id))));
  return values.filter((value): value is CachedRecord => value !== null);
}

function matchesListFilters(value: CachedRecord, filters: {
  poetId: unknown; form: string | null; language: string | null; topicIds: string[] | null;
  moodTopicIds: string[] | null; q: unknown; isTrending: unknown; isFeatured: unknown;
}) {
  if (filters.poetId && value.poet_id !== filters.poetId) return false;
  if (filters.form && value.form !== filters.form) return false;
  if (filters.isTrending !== undefined && Boolean(value.is_trending) !== (String(filters.isTrending) === 'true')) return false;
  if (filters.isFeatured !== undefined && Boolean(value.is_featured) !== (String(filters.isFeatured) === 'true')) return false;
  if (filters.language && !languageMap(value)[filters.language]) return false;
  const topics = relationIds(value, 'topics', 'topic_ids');
  if (filters.topicIds?.length && !topics.some((id) => filters.topicIds!.includes(id))) return false;
  if (filters.moodTopicIds?.length && !topics.some((id) => filters.moodTopicIds!.includes(id))) return false;
  const term = String(filters.q || '').trim().toLowerCase();
  if (term) {
    const searchable = [value.title, value.slug, value.seo_title, value.seo_description, ...Object.values(languageMap(value))].join(' ').toLowerCase();
    if (!searchable.includes(term)) return false;
  }
  return true;
}

function sortShayari(values: CachedRecord[], sort: unknown) {
  return values.sort((a, b) => {
    if (sort === 'trending' || sort === 'mostLoved') return Number(b.popularity_score || 0) - Number(a.popularity_score || 0);
    const dateDifference = Date.parse(b.created_at || '') - Date.parse(a.created_at || '');
    return dateDifference || String(b.id).localeCompare(String(a.id));
  });
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
    if (batchOffset !== null && (!Number.isInteger(batchOffset) || batchOffset < 0)) return res.status(400).json({ error: 'Invalid batch offset' });
    const normalizedLanguage = normalizeLanguage(language);
    const normalizedForm = normalizeForm(form);
    if (language && !normalizedLanguage) return res.status(400).json({ error: 'Invalid language filter' });
    if (form && !normalizedForm) return res.status(400).json({ error: 'Invalid form filter' });

    const version = await getVersion('shayari');
    const cacheKey = buildKey('shayari', 'list', `v${version}`, requestHash(req));
    const { value: response, hit } = await cacheAside(cacheKey, LIST_TTL, async () => {
      const offset = batchOffset ?? calculatedOffset;
      const topicIds = topic ? await resolveTopicIds(topic) : null;
      const moodTopicIds = mood ? await resolveTopicIds(mood, MOOD_TOPIC_ALIASES) : null;
      if ((topic && topicIds?.length === 0) || (mood && moodTopicIds?.length === 0)) {
        return emptyListResponse(page, pageSize);
      }

      const languageSelect = normalizedLanguage ? 'shayari_language_versions!inner(language, text)' : 'shayari_language_versions(language, text)';
      const topicSelect = topic || mood ? ', shayari_topics!inner(topic_id)' : '';
      let query = supabase.from('shayari').select(`*, poets(name, slug, avatar_url), ${languageSelect}${topicSelect}`, { count: 'exact' });
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
          const { data: langMatches } = await supabase.from('shayari_language_versions').select('shayari_id').ilike('text', `%${searchTerm}%`);
          const langIds = [...new Set((langMatches || []).map((item: any) => item.shayari_id))];
          const textFilter = `title.ilike.*${searchTerm}*,slug.ilike.*${searchTerm}*,seo_title.ilike.*${searchTerm}*,seo_description.ilike.*${searchTerm}*`;
          query = langIds.length > 0 ? query.or(`${textFilter},id.in.(${langIds.join(',')})`) : query.or(textFilter);
        }
      }
      switch (sort) {
        case 'trending': query = query.eq('is_trending', true).order('popularity_score', { ascending: false }); break;
        case 'mostLoved': query = query.order('popularity_score', { ascending: false }); break;
        default: query = query.order('created_at', { ascending: false });
      }
      query = query.order('id', { ascending: false });
      if (!searchAll) query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;
      if (error?.code === 'PGRST103') {
        const totalMatch = String(error.details || '').match(/only\s+(\d+)\s+rows/i);
        const total = totalMatch ? Number(totalMatch[1]) : 0;
        return { data: [], pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
      }
      if (error) throw error;

      let responseData = (data || []) as unknown as CachedRecord[];
      let responseTotal = count || 0;
      for (const pending of await getPendingShayari()) {
        const matches = matchesListFilters(pending, { poetId, form: normalizedForm, language: normalizedLanguage, topicIds, moodTopicIds, q, isTrending: is_trending, isFeatured: is_featured });
        const index = responseData.findIndex((item) => item.id === pending.id);
        if (pending._deleted) {
          if (index >= 0) responseData.splice(index, 1);
          if (matches && !pending._pendingCreate) responseTotal = Math.max(0, responseTotal - 1);
        } else if (index >= 0) {
          responseData[index] = publicValue(pending);
        } else if (pending._pendingCreate && matches && (page === 1 || searchAll)) {
          responseData.push(publicValue(pending));
          responseTotal += 1;
        }
      }
      responseData = sortShayari(responseData, sort);
      if (!searchAll) responseData = responseData.slice(0, pageSize);
      const responsePageSize = searchAll ? responseData.length : pageSize;
      return { data: responseData, pagination: { page: searchAll ? 1 : page, pageSize: responsePageSize, total: responseTotal, totalPages: searchAll ? (responseTotal > 0 ? 1 : 0) : Math.ceil(responseTotal / pageSize) } };
    });

    res.set('X-Cache', hit ? 'HIT' : 'MISS').json(response);
  } catch (error) {
    console.error('Error fetching shayari:', error);
    res.status(500).json({ error: 'Failed to fetch shayari' });
  }
});

router.get('/poetry-of-the-day', async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const pageSize = parsePositiveInt(req.query.pageSize, 10, 50);
    const version = await getVersion('shayari');
    const cacheKey = buildKey('shayari', 'list', `v${version}`, 'poetry-of-the-day', requestHash(req));
    const { value: response, hit } = await cacheAside(cacheKey, LIST_TTL, async () => {
      const offset = (page - 1) * pageSize;
      const { data, error, count } = await supabase.from('shayari').select('*, poets(name, slug, avatar_url), shayari_language_versions(language, text)', { count: 'exact' }).eq('is_poetry_of_the_day', true).order('created_at', { ascending: false }).order('id', { ascending: false }).range(offset, offset + pageSize - 1);
      if (error) throw error;
      let responseData = (data || []) as unknown as CachedRecord[];
      let responseTotal = count || 0;
      for (const pending of await getPendingShayari()) {
        const index = responseData.findIndex((item) => item.id === pending.id);
        if (pending._deleted) {
          if (index >= 0) responseData.splice(index, 1);
          if (pending.is_poetry_of_the_day && !pending._pendingCreate) responseTotal = Math.max(0, responseTotal - 1);
        } else if (index >= 0) {
          responseData[index] = publicValue(pending);
        } else if (pending._pendingCreate && pending.is_poetry_of_the_day && page === 1) {
          responseData.push(publicValue(pending));
          responseTotal += 1;
        }
      }
      responseData = sortShayari(responseData, 'latest').slice(0, pageSize);
      return { data: responseData, pagination: { page, pageSize, total: responseTotal, totalPages: Math.ceil(responseTotal / pageSize) } };
    });

    res.set('X-Cache', hit ? 'HIT' : 'MISS').json(response);
  } catch (error) {
    console.error('Error fetching Poetry of the Day:', error);
    res.status(500).json({ error: 'Failed to fetch Poetry of the Day' });
  }
});

router.get('/by-slug', async (req, res) => {
  try {
    const { slug } = req.query;
    if (!slug || typeof slug !== 'string') return res.status(400).json({ error: 'Slug is required' });
    const cacheKey = buildKey('shayari', 'slug', slug);
    const { value: shayari, hit } = await cacheAside<CachedRecord | null>(cacheKey, ITEM_TTL, async () => {
      const fresh = await getShayariDetail('slug', slug);
      if (fresh) void cacheSet(buildKey('shayari', 'item', fresh.id), fresh, ITEM_TTL);
      return fresh;
    });

    res.set('X-Cache', hit ? 'HIT' : 'MISS');
    if (!shayari || shayari._deleted) return res.status(404).json({ error: 'Shayari not found' });
    res.json(publicValue(shayari));
  } catch (error) {
    console.error('Error fetching shayari by slug:', error);
    res.status(500).json({ error: 'Failed to fetch shayari' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const cacheKey = buildKey('shayari', 'item', req.params.id);
    const { value: shayari, hit } = await cacheAside<CachedRecord | null>(cacheKey, ITEM_TTL, async () => {
      const fresh = await getShayariDetail('id', req.params.id);
      if (fresh?.slug) void cacheSet(buildKey('shayari', 'slug', fresh.slug), fresh, ITEM_TTL);
      return fresh;
    });

    res.set('X-Cache', hit ? 'HIT' : 'MISS');
    if (!shayari || shayari._deleted) return res.status(404).json({ error: 'Shayari not found' });
    res.json(publicValue(shayari));
  } catch (error) {
    console.error('Error fetching shayari:', error);
    res.status(500).json({ error: 'Failed to fetch shayari' });
  }
});

router.get('/:id/chat', async (req, res) => {
  try {
    const { page = '1', pageSize = '50' } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    const { data, error, count } = await supabase.from('chat_messages').select('*', { count: 'exact' }).eq('shayari_id', req.params.id).order('created_at', { ascending: false }).range(offset, offset + Number(pageSize) - 1);
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
    const filteredLanguages = Object.fromEntries(Object.entries(languages || {}).filter(([, value]) => typeof value === 'string' && value.trim()));
    if (Object.keys(filteredLanguages).length === 0) return res.status(400).json({ error: true, message: 'At least one language version with text is required' });

    const id = randomUUID();
    const value: CachedRecord = {
      id, poet_id, form: form || 'sher', is_trending: is_trending || false,
      is_featured: is_featured || false, is_poetry_of_the_day: is_poetry_of_the_day || false,
      popularity_score: popularity_score || 0, featured_image_url: featured_image_url || null,
      featured_image_alt: featured_image_alt || null, wordpress_featured_image_id: wordpress_featured_image_id || null,
      slug: slug || null, seo_title: seo_title?.trim() || null, seo_description: seo_description?.trim() || null,
      seo_keywords: seo_keywords?.trim() || null, languages: filteredLanguages,
      topic_ids: Array.isArray(topics) ? topics : [], tag_ids: Array.isArray(tags) ? tags : [],
      shayari_language_versions: Object.entries(filteredLanguages).map(([language, text]) => ({ language, text })),
      topics: Array.isArray(topics) ? topics.map((topicId: string) => ({ id: topicId })) : [],
      tags: Array.isArray(tags) ? tags.map((tagId: string) => ({ id: tagId })) : [],
      created_at: new Date().toISOString(), _pendingCreate: true, _revision: randomUUID()
    };
    const entries = [{ key: buildKey('shayari', 'item', id), value, ttlSeconds: WRITE_TTL }];
    if (value.slug) entries.push({ key: buildKey('shayari', 'slug', value.slug), value, ttlSeconds: WRITE_TTL });
    const queued = await publishDirtyWrite('shayari', id, entries, { bumpResources: value.tag_ids.length ? ['tags'] : [] });
    if (!queued) await persistShayari(value);
    else await enqueuePersistence('shayari', value, persistShayari);
    res.status(201).json(publicValue(value));
  } catch (error: any) {
    res.status(400).json({ error: true, message: error?.message || error?.hint || error?.details || 'Unknown error while saving shayari' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let current = await cachedDetail('id', id);
    if (!current) current = await getShayariDetail('id', id);
    if (!current || current._deleted) return res.status(404).json({ error: true, message: 'Shayari not found' });
    const body = req.body;
    const updates: Record<string, unknown> = {};
    for (const field of ['poet_id', 'form', 'is_trending', 'is_featured', 'is_poetry_of_the_day', 'popularity_score', 'featured_image_url', 'featured_image_alt', 'wordpress_featured_image_id']) {
      if (body[field] !== undefined) updates[field] = body[field];
    }
    if (body.slug !== undefined) updates.slug = body.slug || null;
    for (const field of ['seo_title', 'seo_description', 'seo_keywords']) {
      if (body[field] !== undefined) updates[field] = body[field]?.trim() || null;
    }
    const languages = body.languages !== undefined ? body.languages : languageMap(current);
    const topicIds = body.topics !== undefined ? (Array.isArray(body.topics) ? body.topics : []) : relationIds(current, 'topics', 'topic_ids');
    const tagIds = body.tags !== undefined ? (Array.isArray(body.tags) ? body.tags : []) : relationIds(current, 'tags', 'tag_ids');
    const pendingCreate = Boolean(current._pendingCreate && (await getDirtyIds('shayari')).includes(id));
    const value: CachedRecord = {
      ...current, ...updates, id, languages, topic_ids: topicIds, tag_ids: tagIds, _pendingCreate: pendingCreate, _revision: randomUUID(),
      shayari_language_versions: Object.entries(languages || {}).filter(([, text]) => typeof text === 'string' && text.trim()).map(([language, text]) => ({ language, text })),
      topics: body.topics !== undefined ? topicIds.map((topicId: string) => ({ id: topicId })) : current.topics,
      tags: body.tags !== undefined ? tagIds.map((tagId: string) => ({ id: tagId })) : current.tags
    };
    const entries = [{ key: buildKey('shayari', 'item', id), value, ttlSeconds: WRITE_TTL }];
    if (value.slug) entries.push({ key: buildKey('shayari', 'slug', value.slug), value, ttlSeconds: WRITE_TTL });
    if (current.slug && current.slug !== value.slug) entries.push({ key: buildKey('shayari', 'slug', current.slug), value: { id, _deleted: true }, ttlSeconds: WRITE_TTL });
    const queued = await publishDirtyWrite('shayari', id, entries, { bumpResources: body.tags !== undefined ? ['tags'] : [] });
    if (!queued) await persistShayari(value);
    else await enqueuePersistence('shayari', value, persistShayari);
    res.json(publicValue(value));
  } catch (error: any) {
    res.status(400).json({ error: true, message: error?.message || error?.hint || 'Failed to update shayari' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const current = await cachedDetail('id', id) || await getShayariDetail('id', id);
    const pendingCreate = Boolean(current?._pendingCreate && (await getDirtyIds('shayari')).includes(id));
    const tombstone: CachedRecord = { ...(current || {}), id, _deleted: true, _pendingCreate: pendingCreate, _revision: randomUUID() };
    const entries = [{ key: buildKey('shayari', 'item', id), value: tombstone, ttlSeconds: WRITE_TTL }];
    if (current?.slug) entries.push({ key: buildKey('shayari', 'slug', current.slug), value: tombstone, ttlSeconds: WRITE_TTL });
    const queued = await publishDirtyWrite('shayari', id, entries, { bumpResources: ['tags'] });
    if (!queued) await persistShayari(tombstone);
    else await enqueuePersistence('shayari', tombstone, persistShayari);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: true, message: error?.message || 'Failed to delete shayari' });
  }
});

export default router;
