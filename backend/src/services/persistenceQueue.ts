import { qstash, persistCallbackUrl } from '../config/qstash';
import { CachedRecord, persistImmediately } from './cachePersistence';

type DirtyResource = 'shayari' | 'tags';
type PersistRecord = (item: CachedRecord) => Promise<void>;

export async function enqueuePersistence(
  resource: DirtyResource,
  item: CachedRecord,
  persistFallback: PersistRecord
): Promise<void> {
  if (!qstash) {
    void persistImmediately(resource, item, persistFallback);
    return;
  }

  try {
    const response = await qstash.publishJSON({
      url: persistCallbackUrl(),
      body: { resource, id: item.id, revision: item._revision },
      retries: 5,
      deduplicationId: item._revision
        ? `persist-${resource}-${item.id}-${item._revision}`
        : undefined,
    });
    console.log(`[qstash] Enqueued persist job for ${resource}:${item.id} message=${response.messageId}`);
  } catch (error) {
    console.error(
      `[qstash] Failed to enqueue persist job for ${resource}:${item.id}; the 5-minute safety-net flusher will retry it`,
      error
    );
    // publishDirtyWrite already left this id in Redis's dirty set.
  }
}