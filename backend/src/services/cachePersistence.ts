import { supabase } from '../config/database';
import { buildKey, cacheGet, clearDirty, markDirty } from '../config/redis';

export type CachedRecord = Record<string, any> & { id: string; _deleted?: boolean };

const SHAYARI_COLUMNS = [
  'id', 'poet_id', 'form', 'is_featured',
  'is_poetry_of_the_day', 'popularity_score', 'featured_image_url',
  'featured_image_alt', 'wordpress_featured_image_id', 'slug', 'seo_title',
  'seo_description', 'seo_keywords', 'created_at', 'updated_at'
];
const TAG_COLUMNS = [
  'id', 'name', 'slug', 'description', 'seo_title', 'seo_description',
  'seo_keywords', 'created_at', 'updated_at'
];

function pickColumns(value: CachedRecord, columns: string[]) {
  return Object.fromEntries(columns.filter((column) => value[column] !== undefined).map((column) => [column, value[column]]));
}

function throwOnError(result: { error: any }) {
  if (result.error) throw result.error;
}

export async function persistShayari(item: CachedRecord) {
  if (item._deleted) {
    throwOnError(await supabase.from('shayari_language_versions').delete().eq('shayari_id', item.id));
    throwOnError(await supabase.from('shayari_topics').delete().eq('shayari_id', item.id));
    throwOnError(await supabase.from('shayari_tags').delete().eq('shayari_id', item.id));
    throwOnError(await supabase.from('shayari').delete().eq('id', item.id));
    return;
  }

  throwOnError(await supabase.from('shayari').upsert(pickColumns(item, SHAYARI_COLUMNS)));
  const languages = item.languages ?? item._languages;
  if (languages !== undefined) {
    throwOnError(await supabase.from('shayari_language_versions').delete().eq('shayari_id', item.id));
    const rows = Object.entries(languages as Record<string, string>)
      .filter(([, text]) => typeof text === 'string' && text.trim())
      .map(([language, text]) => ({ shayari_id: item.id, language, text }));
    if (rows.length > 0) throwOnError(await supabase.from('shayari_language_versions').insert(rows));
  }
  const topicIds = item.topic_ids ?? item._topicIds;
  if (topicIds !== undefined) {
    throwOnError(await supabase.from('shayari_topics').delete().eq('shayari_id', item.id));
    const rows = (topicIds as string[]).map((topic_id) => ({ shayari_id: item.id, topic_id }));
    if (rows.length > 0) throwOnError(await supabase.from('shayari_topics').insert(rows));
  }
  const tagIds = item.tag_ids ?? item._tagIds;
  if (tagIds !== undefined) {
    throwOnError(await supabase.from('shayari_tags').delete().eq('shayari_id', item.id));
    const rows = (tagIds as string[]).map((tag_id) => ({ shayari_id: item.id, tag_id }));
    if (rows.length > 0) throwOnError(await supabase.from('shayari_tags').insert(rows));
  }
}

export async function persistTag(item: CachedRecord) {
  if (item._deleted) {
    throwOnError(await supabase.from('shayari_tags').delete().eq('tag_id', item.id));
    throwOnError(await supabase.from('tags').delete().eq('id', item.id));
    return;
  }
  throwOnError(await supabase.from('tags').upsert(pickColumns(item, TAG_COLUMNS)));
}
type DirtyResource = 'shayari' | 'tags';
type PersistRecord = (item: CachedRecord) => Promise<void>;

const persistenceChains = new Map<string, Promise<void>>();

export async function clearDirtyIfCurrent(resource: DirtyResource, item: CachedRecord) {
  const itemKey = buildKey(resource, 'item', item.id);
  const beforeClear = await cacheGet<CachedRecord>(itemKey);
  if (beforeClear?._revision !== item._revision) return;

  await clearDirty(resource, item.id);
  const afterClear = await cacheGet<CachedRecord>(itemKey);
  if (afterClear?._revision !== item._revision) await markDirty(resource, item.id);
}

/**
 * Starts persistence immediately without putting it on the HTTP response path.
 * Different records persist in parallel. Writes for the same record are chained
 * in request order so an older full-object upsert cannot settle after a newer one.
 */
export function persistImmediately(
  resource: DirtyResource,
  item: CachedRecord,
  persist: PersistRecord
): Promise<void> {
  const chainKey = buildKey(resource, item.id);
  const previous = persistenceChains.get(chainKey) ?? Promise.resolve();
  const current = previous
    .catch(() => undefined)
    .then(async () => {
      try {
        await persist(item);
        await clearDirtyIfCurrent(resource, item);
      } catch (error) {
        console.error(
          `[persist] Immediate DB write failed for ${resource}:${item.id}; will retry via safety-net flusher`,
          error
        );
        // publishDirtyWrite already added the id; leave it dirty for retry.
      }
    })
    .finally(() => {
      if (persistenceChains.get(chainKey) === current) persistenceChains.delete(chainKey);
    });

  persistenceChains.set(chainKey, current);
  return current;
}
