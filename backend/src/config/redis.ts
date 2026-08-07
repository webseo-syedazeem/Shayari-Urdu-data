import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';
import path from 'path';
import { gzipSync, gunzipSync } from 'zlib';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis = url && token
  ? new Redis({
      url,
      token,
      // @upstash/redis uses fetch; keep-alive lets Node reuse the HTTPS connection.
      keepAlive: true,
      automaticDeserialization: false,
    })
  : null;

function logRedisError(operation: string, error: unknown) {
  console.error(`[redis] ${operation} failed; falling back to Supabase`, error);
}
const COMPRESSION_THRESHOLD_BYTES = 32 * 1024;

function serializeCacheValue(value: unknown): string {
  const json = JSON.stringify(value);
  return Buffer.byteLength(json) >= COMPRESSION_THRESHOLD_BYTES
    ? `gzip:${gzipSync(json).toString('base64')}`
    : json;
}

function deserializeCacheValue<T>(value: string): T {
  const json = value.startsWith('gzip:')
    ? gunzipSync(Buffer.from(value.slice(5), 'base64')).toString('utf8')
    : value;
  return JSON.parse(json) as T;
}

export function buildKey(...parts: (string | number)[]): string {
  return parts.join(':');
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const value = await redis.get<string>(key);
    return value === null ? null : deserializeCacheValue<T>(value);
  } catch (error) {
    logRedisError(`GET ${key}`, error);
    return null;
  }
}

const inFlight = new Map<string, Promise<unknown>>();

/**
 * Cache-aside with process-local single-flight protection. Concurrent misses
 * for one key share one database fetch. This only coordinates one Node process;
 * multiple instances would require a Redis SET NX EX distributed lock.
 */
export async function cacheAside<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<{ value: T; hit: boolean }> {
  // Keep a resolved fresh value available while its fire-and-forget Redis SET
  // is still pending. This closes the response-to-SET race without delaying
  // the first response or allowing an immediate follower to query the DB.
  const pending = inFlight.get(key) as Promise<T> | undefined;
  if (pending) return { value: await pending, hit: true };

  const cached = await cacheGet<T>(key);
  if (cached !== null) return { value: cached, hit: true };

  // Another request may have started its fetch while this Redis GET awaited.
  const existing = inFlight.get(key) as Promise<T> | undefined;
  if (existing) return { value: await existing, hit: true };

  let promise!: Promise<T>;
  promise = (async () => {
    try {
      const fresh = await fetcher();
      void cacheSet(key, fresh, ttlSeconds).finally(() => {
        if (inFlight.get(key) === promise) inFlight.delete(key);
      });
      return fresh;
    } catch (error) {
      if (inFlight.get(key) === promise) inFlight.delete(key);
      throw error;
    }
  })();

  inFlight.set(key, promise);
  return { value: await promise, hit: false };
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, serializeCacheValue(value), { ex: ttlSeconds });
  } catch (error) {
    logRedisError(`SET ${key}`, error);
  }
}

export async function cacheDel(key: string | string[]): Promise<void> {
  if (!redis) return;
  const keys = Array.isArray(key) ? key : [key];
  if (keys.length === 0) return;
  try {
    await redis.del(...keys);
  } catch (error) {
    logRedisError(`DEL ${keys.join(', ')}`, error);
  }
}

// One server process owns writes today, so versions can be memoized after the
// first Redis read. A multi-instance deployment must replace this with a short
// local TTL or shared invalidation so other instances observe version bumps.
const versionCache = new Map<string, number>();

export async function getVersion(resource: string): Promise<number> {
  const localVersion = versionCache.get(resource);
  if (localVersion !== undefined) return localVersion;
  if (!redis) return 1;
  const key = buildKey('cache-version', resource);
  try {
    const version = await redis.get<string>(key);
    if (version === null) {
      await redis.set(key, '1', { nx: true });
      versionCache.set(resource, 1);
      return 1;
    }
    const parsed = Number(version);
    const validVersion = Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
    versionCache.set(resource, validVersion);
    return validVersion;
  } catch (error) {
    logRedisError(`GET version for ${resource}`, error);
    return 1;
  }
}

export async function bumpVersion(resource: string): Promise<void> {
  if (!redis) return;
  try {
    const version = await redis.incr(buildKey('cache-version', resource));
    versionCache.set(resource, Number(version));
  } catch (error) {
    versionCache.delete(resource);
    logRedisError(`INCR version for ${resource}`, error);
  }
}

export async function markDirty(resource: 'shayari' | 'tags', id: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.sadd(buildKey('dirty', resource), id);
  } catch (error) {
    logRedisError(`SADD dirty:${resource}`, error);
  }
}

export async function getDirtyIds(resource: string): Promise<string[]> {
  if (!redis) return [];
  try {
    return await redis.smembers(buildKey('dirty', resource));
  } catch (error) {
    logRedisError(`SMEMBERS dirty:${resource}`, error);
    return [];
  }
}

export async function clearDirty(resource: string, id: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.srem(buildKey('dirty', resource), id);
  } catch (error) {
    logRedisError(`SREM dirty:${resource}`, error);
  }
}

/** Atomically publishes an admin write and queues it for persistence. */
export async function publishDirtyWrite(
  resource: 'shayari' | 'tags',
  id: string,
  entries: Array<{ key: string; value: unknown; ttlSeconds: number }>,
  options: {
    staleKeys?: string[];
    bumpResources?: Array<'shayari' | 'tags'>;
  } = {}
): Promise<boolean> {
  if (!redis) return false;
  try {
    const pipeline = redis.pipeline();
    entries.forEach(({ key, value, ttlSeconds }) => {
      pipeline.set(key, serializeCacheValue(value), { ex: ttlSeconds });
    });
    if (options.staleKeys?.length) pipeline.del(...options.staleKeys);
    pipeline.incr(buildKey('cache-version', resource));
    options.bumpResources?.forEach((otherResource) => {
      pipeline.incr(buildKey('cache-version', otherResource));
    });
    pipeline.sadd(buildKey('dirty', resource), id);
    await pipeline.exec();
    versionCache.delete(resource);
    options.bumpResources?.forEach((otherResource) => versionCache.delete(otherResource));
    return true;
  } catch (error) {
    logRedisError(`publish dirty ${resource}:${id}`, error);
    return false;
  }
}
