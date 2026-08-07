import { createHash, randomUUID } from 'crypto';
import { Router, Request } from 'express';
import { supabase } from '../config/database';
import { buildKey, cacheAside, cacheGet, cacheSet, getDirtyIds, getVersion, publishDirtyWrite } from '../config/redis';
import { CachedRecord, persistTag } from '../services/cachePersistence';
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

function parsePositiveInt(value: unknown, fallback: number, max?: number) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return max ? Math.min(parsed, max) : parsed;
}

function requestHash(req: Request) {
  const query = Object.entries(req.query)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${Array.isArray(value) ? value.join(',') : String(value)}`)
    .join('&');
  return createHash('sha256').update(query).digest('base64url').slice(0, 24);
}

function publicValue(value: CachedRecord) {
  const { _deleted, _revision, _pendingCreate, ...visible } = value;
  return visible;
}

function tagListValue(value: CachedRecord) {
  const tag = publicValue(value);
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    description: tag.description ?? null,
    wordpress_tag_id: tag.wordpress_tag_id ?? null,
    created_at: tag.created_at,
  };
}

async function getPendingTags(): Promise<CachedRecord[]> {
  const pendingIds = await getDirtyIds('tags');
  return (await Promise.all(
    pendingIds.map((id) => cacheGet<CachedRecord>(buildKey('tags', 'item', id)))
  )).filter((value): value is CachedRecord => value !== null);
}

function minimalTagValue(value: CachedRecord) {
  const tag = publicValue(value);
  return { id: tag.id, name: tag.name, slug: tag.slug };
}

async function getTagById(id: string): Promise<CachedRecord | null> {
  const { data, error } = await supabase.from('tags').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as CachedRecord | null;
}

router.get('/', async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const pageSize = parsePositiveInt(req.query.pageSize, 20, 100);
    const offset = (page - 1) * pageSize;
    const version = await getVersion('tags');
    const cacheKey = buildKey('tags', 'list', `v${version}`, `p${page}`, `s${pageSize}`);
    const { value: response, hit } = await cacheAside(cacheKey, LIST_TTL, async () => {
      const { data, error, count } = await supabase
        .from('tags')
        .select('id, name, slug, description, wordpress_tag_id, created_at, shayari_tags(count)', { count: 'exact' })
        .order('name')
        .range(offset, offset + pageSize - 1);
      if (error) throw error;

      const tagsWithCounts = (data || []).map(({ shayari_tags, ...tag }: any) => ({
        ...tag,
        count: Number(shayari_tags?.[0]?.count || 0),
      }));
      let total = count || 0;

      for (const pending of await getPendingTags()) {
        const index = tagsWithCounts.findIndex((tag) => tag.id === pending.id);
        if (pending._deleted) {
          if (!pending._pendingCreate) total = Math.max(0, total - 1);
          if (index >= 0) tagsWithCounts.splice(index, 1);
        } else if (index >= 0) {
          tagsWithCounts[index] = { ...tagListValue(pending), count: tagsWithCounts[index].count } as any;
        } else if (pending._pendingCreate) {
          total += 1;
          // Pending creates are surfaced immediately while the flusher persists them.
          if (page === 1) tagsWithCounts.push({ ...tagListValue(pending), count: 0 } as any);
        }
      }

      tagsWithCounts.sort((a, b) => String(a.name).localeCompare(String(b.name)));
      return {
        data: tagsWithCounts.slice(0, pageSize),
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      };
    });

    res.set('X-Cache', hit ? 'HIT' : 'MISS').json(response);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

router.get('/all', async (_req, res) => {
  try {
    const version = await getVersion('tags');
    const cacheKey = buildKey('tags', 'all-minimal', `v${version}`);
    const { value: response, hit } = await cacheAside(cacheKey, LIST_TTL, async () => {
      const tags: Array<{ id: string; name: string; slug: string }> = [];
      const batchSize = 1000;
      for (let offset = 0; ; offset += batchSize) {
        const { data, error } = await supabase
          .from('tags')
          .select('id, name, slug')
          .order('name')
          .range(offset, offset + batchSize - 1);
        if (error) throw error;
        const batch = data || [];
        tags.push(...batch);
        if (batch.length < batchSize) break;
      }

      for (const pending of await getPendingTags()) {
        const index = tags.findIndex((tag) => tag.id === pending.id);
        if (pending._deleted) {
          if (index >= 0) tags.splice(index, 1);
        } else if (index >= 0) {
          tags[index] = minimalTagValue(pending) as any;
        } else if (pending._pendingCreate) {
          tags.push(minimalTagValue(pending) as any);
        }
      }

      tags.sort((a, b) => String(a.name).localeCompare(String(b.name)));
      return { data: tags };
    });

    res.set('X-Cache', hit ? 'HIT' : 'MISS').json(response);
  } catch (error) {
    console.error('Error fetching all tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

router.get('/by-id/:id', async (req, res) => {
  try {
    const cacheKey = buildKey('tags', 'item', req.params.id);
    const { value: tag, hit } = await cacheAside<CachedRecord | null>(cacheKey, ITEM_TTL, () => getTagById(req.params.id));

    res.set('X-Cache', hit ? 'HIT' : 'MISS');
    if (!tag || tag._deleted) return res.status(404).json({ error: 'Tag not found' });
    res.json(publicValue(tag));
  } catch (error) {
    console.error('Error fetching tag by id:', error);
    res.status(500).json({ error: 'Failed to fetch tag' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const page = Number(req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 20);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1) {
      return res.status(400).json({ error: 'Invalid pagination' });
    }
    const [tagVersion, shayariVersion] = await Promise.all([getVersion('tags'), getVersion('shayari')]);
    const isDefaultPage = page === 1 && pageSize === 20;
    const cacheKey = isDefaultPage
      ? buildKey('tags', 'slug', slug)
      : buildKey('tags', 'slug', slug, `v${tagVersion}`, `sv${shayariVersion}`, requestHash(req));
    const { value: response, hit } = await cacheAside<CachedRecord | null>(cacheKey, ITEM_TTL, async () => {
      const offset = (page - 1) * pageSize;
      const { data: tag, error: tagError } = await supabase.from('tags').select('*').eq('slug', slug).maybeSingle();
      if (tagError) throw tagError;
      if (!tag) return null;
      const { data: shayariIds, error: idsError } = await supabase.from('shayari_tags').select('shayari_id').eq('tag_id', tag.id);
      if (idsError) throw idsError;
      const ids = (shayariIds || []).map((item: any) => item.shayari_id);
      let fresh: CachedRecord;
      if (ids.length === 0) {
        fresh = { ...tag, shayari: [], pagination: { page, pageSize, total: 0, totalPages: 0 } };
      } else {
        const { data: shayari, error, count } = await supabase.from('shayari').select('*, poets(name, slug, avatar_url), shayari_language_versions(language, text)', { count: 'exact' }).in('id', ids).order('created_at', { ascending: false }).range(offset, offset + pageSize - 1);
        if (error) throw error;
        fresh = { ...tag, shayari, pagination: { page, pageSize, total: count || 0, totalPages: Math.ceil((count || 0) / pageSize) } };
      }
      void cacheSet(buildKey('tags', 'item', tag.id), tag, ITEM_TTL);
      return fresh;
    });

    res.set('X-Cache', hit ? 'HIT' : 'MISS');
    if (!response || response._deleted) return res.status(404).json({ error: 'Tag not found' });
    res.json(publicValue(response));
  } catch (error) {
    console.error('Error fetching tag:', error);
    res.status(500).json({ error: 'Failed to fetch tag' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, slug, description, seo_title, seo_description, seo_keywords } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const id = randomUUID();
    const finalSlug = slug || name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/--+/g, '-').trim();
    const value: CachedRecord = {
      id, name, slug: finalSlug, description: description || null,
      seo_title: seo_title?.trim() || null, seo_description: seo_description?.trim() || null,
      seo_keywords: seo_keywords?.trim() || null, _pendingCreate: true, _revision: randomUUID()
    };
    const slugValue = { ...value, shayari: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } };
    const queued = await publishDirtyWrite('tags', id, [
      { key: buildKey('tags', 'item', id), value, ttlSeconds: WRITE_TTL },
      { key: buildKey('tags', 'slug', finalSlug), value: slugValue, ttlSeconds: WRITE_TTL }
    ]);
    if (!queued) await persistTag(value);
    else await enqueuePersistence('tags', value, persistTag);
    res.status(201).json(value);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to create tag' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let current = await cacheGet<CachedRecord>(buildKey('tags', 'item', id));
    if (!current) current = await getTagById(id);
    if (!current || current._deleted) return res.status(404).json({ error: 'Tag not found' });
    const body = req.body;
    const updates: Record<string, unknown> = {};
    for (const field of ['name', 'slug', 'description']) {
      if (body[field] !== undefined) updates[field] = body[field];
    }
    for (const field of ['seo_title', 'seo_description', 'seo_keywords']) {
      if (body[field] !== undefined) updates[field] = body[field]?.trim() || null;
    }
    const pendingCreate = Boolean(current._pendingCreate && (await getDirtyIds('tags')).includes(id));
    const value: CachedRecord = { ...current, ...updates, id, _pendingCreate: pendingCreate, _revision: randomUUID() };
    const previousSlugValue = current.slug ? await cacheGet<CachedRecord>(buildKey('tags', 'slug', current.slug)) : null;
    const slugValue = {
      ...value,
      shayari: previousSlugValue?.shayari || [],
      pagination: previousSlugValue?.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 0 }
    };
    const entries = [
      { key: buildKey('tags', 'item', id), value, ttlSeconds: WRITE_TTL },
      { key: buildKey('tags', 'slug', value.slug), value: slugValue, ttlSeconds: WRITE_TTL }
    ];
    if (current.slug && current.slug !== value.slug) entries.push({ key: buildKey('tags', 'slug', current.slug), value: { id, _deleted: true }, ttlSeconds: WRITE_TTL });
    const queued = await publishDirtyWrite('tags', id, entries);
    if (!queued) await persistTag(value);
    else await enqueuePersistence('tags', value, persistTag);
    res.json(publicValue(value));
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to update tag' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const current = await cacheGet<CachedRecord>(buildKey('tags', 'item', id)) || await getTagById(id);
    const pendingCreate = Boolean(current?._pendingCreate && (await getDirtyIds('tags')).includes(id));
    const tombstone: CachedRecord = { ...(current || {}), id, _deleted: true, _pendingCreate: pendingCreate, _revision: randomUUID() };
    const entries = [{ key: buildKey('tags', 'item', id), value: tombstone, ttlSeconds: WRITE_TTL }];
    if (current?.slug) entries.push({ key: buildKey('tags', 'slug', current.slug), value: tombstone, ttlSeconds: WRITE_TTL });
    const queued = await publishDirtyWrite('tags', id, entries);
    if (!queued) await persistTag(tombstone);
    else await enqueuePersistence('tags', tombstone, persistTag);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to delete tag' });
  }
});

export default router;
