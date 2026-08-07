import { buildKey, cacheGet, clearDirty, getDirtyIds, markDirty } from '../config/redis';
import { CachedRecord, persistShayari, persistTag } from '../services/cachePersistence';

// Signed QStash jobs are the primary persistence path. This flusher is only a
// low-frequency retry safety net for jobs that could not be published or completed,
// plus dirty records recovered after a process crash.

type DirtyResource = 'shayari' | 'tags';

async function flushResource(resource: DirtyResource) {
  const ids = await getDirtyIds(resource);
  for (const id of ids) {
    const item = await cacheGet<CachedRecord>(buildKey(resource, 'item', id));
    if (!item) {
      console.warn(`[cache-flusher] Missing cached ${resource}:${id}; leaving it dirty for retry`);
      continue;
    }
    try {
      if (resource === 'shayari') await persistShayari(item);
      else await persistTag(item);

      // Do not clear a newer mutation that arrived while this item was flushing.
      const beforeClear = await cacheGet<CachedRecord>(buildKey(resource, 'item', id));
      if (beforeClear?._revision === item._revision) {
        await clearDirty(resource, id);
        const afterClear = await cacheGet<CachedRecord>(buildKey(resource, 'item', id));
        if (afterClear?._revision !== item._revision) await markDirty(resource, id);
      }
    } catch (error) {
      console.error(`[cache-flusher] Failed to persist ${resource}:${id}; it will be retried`, error);
    }
  }
}

let flushing = false;

export async function flushDirtyCache(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    await Promise.all([flushResource('shayari'), flushResource('tags')]);
  } finally {
    flushing = false;
  }
}

export function startCacheFlusher(): NodeJS.Timeout {
  void flushDirtyCache();
  const timer = setInterval(() => void flushDirtyCache(), 5 * 60_000); // retry safety net only
  timer.unref();
  return timer;
}