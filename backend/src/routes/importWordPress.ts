import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { supabase } from '../config/database';

const router = Router();

interface WPPost {
  id: number;
  slug: string;
  link: string;
  title?: { rendered?: string } | string;
  content?: { rendered?: string } | string;
  categories: number[];
  tags: number[];
  featured_media?: number;
  yoast_head_json?: { title?: string; description?: string; canonical?: string };
}

interface WPCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  yoast_head_json?: { title?: string; description?: string };
}

interface WPTag {
  id: number;
  name: string;
  slug: string;
  description: string;
  yoast_head_json?: { title?: string; description?: string };
}

interface WPMedia {
  id: number;
  source_url: string;
  alt_text?: string;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#8216;/g, '‘')   // left single quotation mark '
    .replace(/&#8217;/g, '’')   // right single quotation mark '
    .replace(/&#8220;/g, '“')   // left double quotation mark "
    .replace(/&#8221;/g, '”')   // right double quotation mark "
    .replace(/&#8211;/g, '–')   // en dash –
    .replace(/&#8212;/g, '—')   // em dash —
    .replace(/&#8230;/g, '…')   // ellipsis …
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function cleanSeoTitle(title: string): string {
  return decodeHtmlEntities(title).replace(/\s*[-|]\s*Urdu Poetry\s*$/i, '').trim();
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, "'")
    .trim();
}

function extractFirstImageUrl(html: string): string | null {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

function extractTitle(post: WPPost): string {
  const raw = typeof post.title === 'string' ? post.title : (post.title?.rendered || '');
  return decodeHtmlEntities(raw);
}

function extractContent(post: WPPost): string {
  if (typeof post.content === 'string') return post.content;
  return post.content?.rendered || '';
}

function detectLanguage(text: string): 'urdu' | 'hindi' | 'roman_urdu' {
  if (/[\u0600-\u06FF]/.test(text)) return 'urdu';   // Arabic/Urdu script
  if (/[\u0900-\u097F]/.test(text)) return 'hindi';  // Devanagari/Hindi
  return 'roman_urdu';
}

function cleanBlock(inner: string): string {
  let t = inner.replace(/<br\s*\/?>/gi, '\n');
  t = t.replace(/<[^>]+>/g, '');
  t = decodeHtmlEntities(t);
  t = t.replace(/\u00a0/g, ' ');
  t = t.replace(/[ \t]+/g, ' ');
  return t.split('\n').map(line => line.trim()).filter(Boolean).join('\n').trim();
}

function extractLanguageVersions(content: string) {
  const groups: Record<'urdu' | 'hindi' | 'roman_urdu', string[]> = {
    urdu: [], hindi: [], roman_urdu: [],
  };
  const blockRe = /<(h[1-6]|p)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = blockRe.exec(content)) !== null) {
    const text = cleanBlock(match[2]);
    if (text.length < 3) continue;
    groups[detectLanguage(text)].push(text);
  }

  const versions: { language: 'urdu' | 'hindi' | 'roman_urdu'; text: string }[] = [];
  (['roman_urdu', 'urdu', 'hindi'] as const).forEach(language => {
    if (groups[language].length) {
      versions.push({ language, text: groups[language].join('\n') });
    }
  });
  return versions;
}

async function wpFetch(url: string, retries = 5): Promise<any> {
  const delays = [2000, 5000, 10000, 20000, 30000];
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 60000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) return await res.json();
      const body = await res.json().catch(() => ({}));
      throw new Error(`WP API ${res.status}: ${JSON.stringify(body)}`);
    } catch (err: any) {
      if (err.message?.includes('WP API 4')) throw err; // don't retry 4xx
      if (attempt === retries - 1) throw err;
      await new Promise(r => setTimeout(r, delays[attempt]));
    }
  }
  throw new Error('Max retries reached');
}

router.post('/', async (req: Request, res: Response) => {
  const { siteUrl } = req.body;

  if (!siteUrl) return res.status(400).json({ error: 'siteUrl is required' });

  let baseUrl: string;
  let pp = 50; // default per_page
  let startPage = 1; // resume from this page
  try {
    const parsed = new URL(String(siteUrl).replace(/\/$/, ''));
    baseUrl = parsed.origin;
    const qp = parseInt(parsed.searchParams.get('per_page') || '50');
    pp = Math.max(1, Math.min(100, qp));
    const sp = parseInt(parsed.searchParams.get('start_page') || '1');
    startPage = Math.max(1, sp);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  const limit = 0; // import all
  const diagnosticLimit = Math.max(0, Number(process.env.WORDPRESS_IMPORT_DIAGNOSTIC_LIMIT) || 0);

  // SSE setup
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Heartbeat every 15s so the connection never times out
  const heartbeat = setInterval(() => {
    res.write(': ping\n\n');
  }, 15000);

  const send = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const progress = {
    totalFetched: 0,
    imported: 0,
    skipped: 0,
    errors: [] as string[],
    currentPage: 0,
    lastPostId: 0,
  };

  try {
    // ---- CATEGORIES → topics ----
    send({ type: 'status', message: 'Fetching categories from WordPress...' });
    const allCats: WPCategory[] = [];
    let catPage = 1;
    while (true) {
      const cats: WPCategory[] = await wpFetch(
        `${baseUrl}/wp-json/wp/v2/categories?per_page=100&page=${catPage}&_fields=id,name,slug,description,yoast_head_json`
      );
      if (!Array.isArray(cats) || cats.length === 0) break;
      allCats.push(...cats);
      catPage++;
      if (cats.length < 100) break;
    }
    send({ type: 'status', message: `${allCats.length} categories fetched. Saving to database...` });

    const categoryMap = new Map<number, string>();
    if (allCats.length > 0) {
      const catSlugs = allCats.map(c => c.slug);
      const { data: existingCats } = await supabase.from('topics').select('id,slug').in('slug', catSlugs);
      const existingCatMap = new Map((existingCats || []).map((r: any) => [r.slug, r.id]));

      const newCats = allCats.filter(c => !existingCatMap.has(c.slug));
      if (newCats.length > 0) {
        const { data: inserted } = await supabase.from('topics')
          .insert(newCats.map(c => ({
            name: c.name, slug: c.slug,
            description: c.description || `Browse shayari about ${c.name}`,
            icon: 'BookOpen',
            seo_title: cleanSeoTitle(c.yoast_head_json?.title || c.name),
            seo_description: c.yoast_head_json?.description || c.description || `Browse shayari about ${c.name}`,
            seo_keywords: null,
          })))
          .select('id,slug');
        for (const r of (inserted || []) as any[]) existingCatMap.set(r.slug, r.id);
      }
      for (const cat of allCats) {
        const id = existingCatMap.get(cat.slug);
        if (id) categoryMap.set(cat.id, id);
      }
    }
    send({ type: 'status', message: `Categories done (${categoryMap.size}). Fetching tags...` });

    // ---- TAGS ----
    const allTags: WPTag[] = [];
    let tagPage = 1;
    while (true) {
      const tags: WPTag[] = await wpFetch(
        `${baseUrl}/wp-json/wp/v2/tags?per_page=100&page=${tagPage}&_fields=id,name,slug,description,yoast_head_json`
      );
      if (!Array.isArray(tags) || tags.length === 0) break;
      allTags.push(...tags);
      send({ type: 'status', message: `Tags fetched so far: ${allTags.length} (page ${tagPage})...` });
      tagPage++;
      if (tags.length < 100) break;
    }
    send({ type: 'status', message: `${allTags.length} tags fetched. Saving to database...` });

    const tagMap = new Map<number, string>();
    if (allTags.length > 0) {
      // batch in chunks of 500 to avoid Supabase IN-clause limits
      const CHUNK = 500;
      for (let i = 0; i < allTags.length; i += CHUNK) {
        const chunk = allTags.slice(i, i + CHUNK);
        const slugs = chunk.map(t => t.slug);
        const { data: existingTags } = await supabase.from('tags').select('id,slug').in('slug', slugs);
        const existingTagMap = new Map((existingTags || []).map((r: any) => [r.slug, r.id]));

        const newTags = chunk.filter(t => !existingTagMap.has(t.slug));
        if (newTags.length > 0) {
          const { data: inserted } = await supabase.from('tags')
            .insert(newTags.map(t => ({
              name: t.name, slug: t.slug,
              description: t.description || null,
              seo_title: cleanSeoTitle(t.yoast_head_json?.title || t.name),
              seo_description: t.yoast_head_json?.description || t.description || null,
              seo_keywords: null,
            })))
            .select('id,slug');
          for (const r of (inserted || []) as any[]) existingTagMap.set(r.slug, r.id);
        }
        for (const tag of chunk) {
          const id = existingTagMap.get(tag.slug);
          if (id) tagMap.set(tag.id, id);
        }
      }
    }
    send({ type: 'status', message: `Tags done (${tagMap.size}). Starting posts...` });
    const linkTags = async (shayariId: string, wordpressTagIds: number[]) => {
      const rows = wordpressTagIds.flatMap(tagId => {
        const tagUuid = tagMap.get(tagId);
        return tagUuid
          ? [{ id: randomUUID(), shayari_id: shayariId, tag_id: tagUuid }]
          : [];
      });

      if (rows.length === 0) return;

      const { error } = await supabase
        .from('shayari_tags')
        .upsert(rows, {
          onConflict: 'shayari_id,tag_id',
          ignoreDuplicates: true,
        });

      if (error) {
        throw new Error('Tag linking failed: ' + error.message);
      }
    };


    // ---- POSTS ----
    let postPage = startPage;
    let totalImported = 0;
    let diagnosticPostCount = 0;

    if (startPage > 1) {
      send({ type: 'status', message: `Resuming from page ${startPage}...` });
    }

    outer: while (true) {
      if (limit > 0 && totalImported >= limit) break;

      progress.currentPage = postPage;
      send({ type: 'progress', ...progress, message: `Fetching posts page ${postPage} (${pp}/page)...` });

      const posts: WPPost[] = await wpFetch(
        `${baseUrl}/wp-json/wp/v2/posts?per_page=${pp}&page=${postPage}&_fields=id,slug,title,content,categories,tags,featured_media,link,yoast_head_json`
      );

      if (!Array.isArray(posts) || posts.length === 0) break;

      progress.totalFetched += posts.length;

      for (const post of posts) {
        if (limit > 0 && totalImported >= limit) break outer;

        try {
          const title = extractTitle(post);
          const contentRaw = extractContent(post);

          if (!title && !contentRaw) { progress.skipped++; continue; }

          // duplicate check
          const { data: byWpId } = await supabase.from('shayari').select('id').eq('wordpress_post_id', post.id).maybeSingle();
          if (byWpId) {
            await linkTags(byWpId.id, post.tags || []);
            progress.skipped++;
            continue;
          }
          const { data: bySlug } = await supabase.from('shayari').select('id').eq('slug', post.slug).maybeSingle();
          if (bySlug) { progress.skipped++; continue; }

          if (diagnosticLimit > 0 && diagnosticPostCount >= diagnosticLimit) break outer;

          const content = stripHtml(contentRaw);
          const languages = extractLanguageVersions(contentRaw);
          diagnosticPostCount++;

          if (diagnosticPostCount <= 3) {
            console.log('[WP Import debug] Post ' + post.id + ' languages.length:', languages.length);
          }
          if (diagnosticPostCount === 1) {
            console.log('[WP Import debug] First post ' + post.id + ' contentRaw:', contentRaw);
          }

          if (languages.length === 0) {
            if (diagnosticPostCount === 1) {
              console.log('[WP Import debug] First post ' + post.id + ' langInserts:', []);
            }
            progress.skipped++;
            continue;
          }

          const seoTitle = cleanSeoTitle(post.yoast_head_json?.title || title);
          const seoDesc = (post.yoast_head_json?.description || content.slice(0, 160)).trim() || null;
          const canonicalUrl = post.yoast_head_json?.canonical || null;

          let featuredImageUrl: string | null = null;
          let featuredImageAlt: string | null = null;
          let wpFeaturedMediaId: number | null = null;

          if (post.featured_media && post.featured_media > 0) {
            try {
              const media: WPMedia = await wpFetch(`${baseUrl}/wp-json/wp/v2/media/${post.featured_media}`);
              if (media?.source_url) {
                featuredImageUrl = media.source_url;
                featuredImageAlt = media.alt_text || title;
                wpFeaturedMediaId = media.id;
              }
            } catch { /* skip media errors */ }
          }

          if (!featuredImageUrl) featuredImageUrl = extractFirstImageUrl(contentRaw);

          const { data: shayari, error: shayariError } = await supabase.from('shayari').insert({
            title,
            slug: post.slug,
            wordpress_post_id: post.id,
            wordpress_url: post.link,
            canonical_url: canonicalUrl,
            form: 'sher',
            poet_id: null,
            featured_image_url: featuredImageUrl,
            featured_image_alt: featuredImageAlt,
            wordpress_featured_image_id: wpFeaturedMediaId,
            is_featured: false,
            popularity_score: 0,
            source: 'wordpress',
            seo_title: seoTitle,
            seo_description: seoDesc,
            seo_keywords: null,
          }).select('id').single();

          if (shayariError || !shayari) {
            if (progress.errors.length < 50)
              progress.errors.push(`Post ${post.id} (${post.slug}): ${shayariError?.message || 'Insert failed'}`);
            continue;
          }

          const langInserts = languages.map(({ language, text }) => ({
            shayari_id: shayari.id,
            language,
            text,
          }));

          if (diagnosticPostCount === 1) {
            console.log('[WP Import debug] First post ' + post.id + ' langInserts:', langInserts);
          }

          const { data: insertedLanguages, error: languageError } = await supabase
            .from('shayari_language_versions')
            .insert(langInserts)
            .select('id');

          if (languageError) {
            console.error('[WP Import] Language insert failed for post ' + post.id + ':', {
              message: languageError.message,
              details: languageError.details,
              hint: languageError.hint,
              code: languageError.code,
            });
            if (progress.errors.length < 50) {
              progress.errors.push('Post ' + post.id + ' (' + post.slug + ') language insert: ' + languageError.message);
            }
            send({ type: 'progress', ...progress });
            continue;
          }

          if (!insertedLanguages || insertedLanguages.length === 0) {
            console.error('[WP Import] Language insert returned zero rows for post ' + post.id);
            if (progress.errors.length < 50) {
              progress.errors.push('Post ' + post.id + ' (' + post.slug + ') language insert returned zero rows');
            }
            send({ type: 'progress', ...progress });
            continue;
          }

          for (const catId of (post.categories || [])) {
            const topicId = categoryMap.get(catId);
            if (topicId) await supabase.from('shayari_topics').insert({ shayari_id: shayari.id, topic_id: topicId }).then(() => {});
          }

          await linkTags(shayari.id, post.tags || []);

          progress.imported++;
          progress.lastPostId = post.id;
          totalImported++;

          // send live update after every post
          send({ type: 'progress', ...progress });
        } catch (err: any) {
          if (progress.errors.length < 50)
            progress.errors.push(`Post ${post.id}: ${err?.message || String(err)}`);
          send({ type: 'progress', ...progress });
        }
      }

      postPage++;
      if (posts.length < pp) break;
      await new Promise(r => setTimeout(r, 200));
    }

    send({ type: 'complete', ...progress });
  } catch (err: any) {
    send({ type: 'error', message: err?.message || 'Import failed', ...progress });
  } finally {
    clearInterval(heartbeat);
    res.end();
  }
});

export default router;
