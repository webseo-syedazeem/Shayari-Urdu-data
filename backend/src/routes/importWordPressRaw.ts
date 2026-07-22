import { Router, Request, Response } from 'express';
import { supabase } from '../config/database';

const router = Router();
const DEFAULT_WORDPRESS_POSTS_URL = 'https://shayariurdu.com/wp-json/wp/v2/posts';

interface RawWordPressPost {
  id?: unknown;
  [key: string]: unknown;
}

interface WordPressPage {
  posts: RawWordPressPost[];
  totalPages: number;
}

interface RawPostRow {
  wordpress_post_id: number;
  raw_json: RawWordPressPost;
}

const DATABASE_BATCH_SIZE = 25;
const DATABASE_RETRY_DELAYS = [1000, 2000, 5000, 10000, 20000, 30000];
const WORDPRESS_RETRY_DELAYS = [5000, 15000, 30000, 60000, 90000, 120000];
const WORDPRESS_PAGE_DELAY_MS = 2500;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatSupabaseError(error: any): string {
  return (
    '[' + (error?.code || 'unknown') + ']: ' + (error?.message || String(error)) +
    (error?.details ? ' Details: ' + error.details : '') +
    (error?.hint ? ' Hint: ' + error.hint : '')
  );
}

function isPermanentDatabaseError(error: any): boolean {
  const code = String(error?.code || '');
  return /^(22|23|42)/.test(code);
}

async function saveRawPostBatch(rows: RawPostRow[], page: number, batch: number): Promise<void> {
  const ids = rows.map(row => row.wordpress_post_id);
  let lastError: any;

  for (let attempt = 0; attempt <= DATABASE_RETRY_DELAYS.length; attempt++) {
    try {
      // Check again on every attempt. A disconnected insert may still have
      // committed successfully, so this also prevents retry duplicates.
      const { data: existing, error: selectError } = await supabase
        .from('wp_raw_posts')
        .select('wordpress_post_id')
        .in('wordpress_post_id', ids);

      if (selectError) throw selectError;

      const existingIds = new Set(
        (existing || []).map(row => Number(row.wordpress_post_id))
      );
      const missingRows = rows.filter(row => !existingIds.has(row.wordpress_post_id));

      if (missingRows.length === 0) return;

      const { error: insertError } = await supabase
        .from('wp_raw_posts')
        .insert(missingRows);

      if (insertError) throw insertError;
      return;
    } catch (error: any) {
      lastError = error;
      if (isPermanentDatabaseError(error) || attempt === DATABASE_RETRY_DELAYS.length) break;

      const delay = DATABASE_RETRY_DELAYS[attempt];
      console.warn(
        '[WP Raw Import] Database connection failed on page ' + page +
        ', batch ' + batch + ', attempt ' + (attempt + 1) +
        '. Retrying in ' + delay + 'ms. ' + formatSupabaseError(error)
      );
      await sleep(delay);
    }
  }

  throw new Error(
    'wp_raw_posts save failed on page ' + page + ', batch ' + batch + ' ' +
    formatSupabaseError(lastError)
  );
}

function resolveWordPressPostsUrl(siteUrl: unknown): string {
  if (typeof siteUrl !== 'string' || !siteUrl.trim()) {
    return DEFAULT_WORDPRESS_POSTS_URL;
  }

  const parsed = new URL(siteUrl.trim());
  return parsed.origin + '/wp-json/wp/v2/posts';
}

async function fetchWordPressPage(
  postsUrl: string,
  page: number,
  retries = WORDPRESS_RETRY_DELAYS.length + 1
): Promise<WordPressPage> {
  const url = postsUrl + '?per_page=100&page=' + page;

  for (let attempt = 0; attempt < retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'ShayariUrdu-WordPress-Importer/1.0',
        },
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        const securityVerification =
          response.status === 401 && /security verification|stackprotect|recaptcha/i.test(body);
        const retryable = securityVerification || response.status === 429 || response.status >= 500;
        const error: any = new Error(
          securityVerification
            ? 'WordPress security verification blocked page ' + page
            : 'WordPress API ' + response.status + ': ' + body.slice(0, 500)
        );
        error.retryable = retryable;
        throw error;
      }

      const posts = await response.json();
      if (!Array.isArray(posts)) {
        throw new Error('WordPress API returned a non-array response for page ' + page);
      }

      const totalPages = Number(response.headers.get('x-wp-totalpages'));
      if (!Number.isInteger(totalPages) || totalPages < 1) {
        throw new Error('Missing or invalid X-WP-TotalPages header on page ' + page);
      }

      return { posts: posts as RawWordPressPost[], totalPages };
    } catch (error: any) {
      const isClientError = error?.message?.startsWith('WordPress API 4');
      if ((isClientError && !error?.retryable) || attempt === retries - 1) throw error;

      const delay = WORDPRESS_RETRY_DELAYS[attempt];
      console.warn(
        '[WP Raw Import] WordPress page ' + page + ' fetch failed, attempt ' +
        (attempt + 1) + '. Retrying in ' + delay + 'ms. ' + error.message
      );
      await sleep(delay);
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error('Maximum WordPress fetch retries reached');
}

router.post('/', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data: object) => {
    res.write('data: ' + JSON.stringify(data) + '\n\n');
  };

  const heartbeat = setInterval(() => {
    res.write(': ping\n\n');
  }, 15000);

  let totalInserted = 0;

  try {
    const postsUrl = resolveWordPressPostsUrl(req.body?.siteUrl);
    const firstPage = await fetchWordPressPage(postsUrl, 1);
    const totalPages = firstPage.totalPages;

    send({ type: 'start', totalPages });
    console.log('[WP Raw Import] Total pages: ' + totalPages);

    for (let page = 1; page <= totalPages; page++) {
      if (page > 1) {
        // Avoid triggering the source site's bot/rate-limit protection.
        await sleep(WORDPRESS_PAGE_DELAY_MS);
      }

      const posts = page === 1
        ? firstPage.posts
        : (await fetchWordPressPage(postsUrl, page)).posts;

      const rows: RawPostRow[] = posts
        .filter((post): post is RawWordPressPost & { id: number } => typeof post.id === 'number')
        .map(post => ({
          wordpress_post_id: post.id,
          raw_json: post,
        }));

      for (let offset = 0; offset < rows.length; offset += DATABASE_BATCH_SIZE) {
        const batchNumber = Math.floor(offset / DATABASE_BATCH_SIZE) + 1;
        await saveRawPostBatch(
          rows.slice(offset, offset + DATABASE_BATCH_SIZE),
          page,
          batchNumber
        );
      }

      totalInserted += rows.length;
      console.log(
        '[WP Raw Import] Page ' + page + '/' + totalPages +
        ' inserted. Total inserted: ' + totalInserted
      );
      send({
        type: 'progress',
        page,
        totalPages,
        pageInserted: rows.length,
        totalInserted,
      });
    }

    console.log('[WP Raw Import] Complete. Total inserted: ' + totalInserted);
    send({ type: 'complete', totalPages, totalInserted });
  } catch (error: any) {
    console.error('[WP Raw Import] Failed:', error);
    send({
      type: 'error',
      message: error?.message || String(error),
      totalInserted,
    });
  } finally {
    clearInterval(heartbeat);
    res.end();
  }
});

export default router;
