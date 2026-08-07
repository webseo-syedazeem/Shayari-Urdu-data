import { Receiver } from '@upstash/qstash';
import { Router } from 'express';

import { persistCallbackUrl } from '../config/qstash';
import { buildKey, cacheGet } from '../config/redis';
import {
  CachedRecord,
  clearDirtyIfCurrent,
  persistShayari,
  persistTag,
} from '../services/cachePersistence';

const router = Router();
const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY?.trim();
const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY?.trim();
const receiver = currentSigningKey && nextSigningKey
  ? new Receiver({ currentSigningKey, nextSigningKey })
  : null;

type PersistJob = {
  resource: 'shayari' | 'tags';
  id: string;
  revision?: string;
};

router.post('/', async (req, res) => {
  if (!receiver) {
    console.error('[qstash-persist] Signing keys are not configured; refusing webhook');
    return res.status(503).json({ error: 'QStash signature verification is not configured' });
  }
  if (!Buffer.isBuffer(req.body)) {
    return res.status(400).json({ error: 'Expected a raw JSON request body' });
  }

  const signature = req.get('Upstash-Signature');
  if (!signature) return res.status(401).json({ error: 'Missing QStash signature' });

  const rawBody = req.body.toString('utf8');
  try {
    await receiver.verify({
      signature,
      body: rawBody,
      url: persistCallbackUrl(),
    });
  } catch (error) {
    console.warn('[qstash-persist] Rejected invalid QStash signature');
    return res.status(401).json({ error: 'Invalid QStash signature' });
  }

  try {
    const job = JSON.parse(rawBody) as Partial<PersistJob>;
    if ((job.resource !== 'shayari' && job.resource !== 'tags') || typeof job.id !== 'string' || !job.id) {
      return res.status(400).json({ error: 'Invalid persistence job payload' });
    }

    const item = await cacheGet<CachedRecord>(buildKey(job.resource, 'item', job.id));
    if (!item) {
      console.warn(`[qstash-persist] No cached ${job.resource}:${job.id} found; leaving any dirty marker for the safety-net flusher`);
      return res.json({ ok: true, skipped: true, reason: 'cache-miss' });
    }

    // Duplicate and out-of-order deliveries are expected. A stale job must not
    // persist or clear the dirty marker belonging to a newer cached mutation.
    if (job.revision && item._revision !== job.revision) {
      return res.json({ ok: true, skipped: true, reason: 'stale-revision' });
    }

    if (job.resource === 'shayari') await persistShayari(item);
    else await persistTag(item);

    await clearDirtyIfCurrent(job.resource, item);
    return res.json({ ok: true });
  } catch (error) {
    console.error('[qstash-persist] Failed to persist; QStash will retry', error);
    return res.status(500).json({ error: 'Persist failed, will retry' });
  }
});

export default router;