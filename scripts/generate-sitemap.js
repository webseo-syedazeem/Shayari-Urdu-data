// Generates public/sitemap.xml (+ public/robots.txt) from live Supabase data.
// Runs at build time (see package.json "build" script) so the sitemap stays
// in sync with the database without a separate deploy/cron step.
import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');

const SITE_URL = (process.env.SITE_URL || 'https://shayariurdu.com').replace(/\/$/, '');
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
// Deliberately the service-role key, not the anon key: the anon role has no
// SELECT access on these tables (all reads normally go through the backend
// API, which holds the service-role key server-side). Using it here keeps
// this build-time script self-contained and independent of the backend
// being reachable during the Vercel build. Must be set as a plain (non
// VITE_-prefixed) env var so Vite never inlines it into client code.
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const PAGE_SIZE = 1000;
const MAX_URLS_PER_SITEMAP = 50000;

function xmlEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry(loc, lastmod, changefreq, priority) {
  let entry = `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n`;
  if (lastmod) entry += `    <lastmod>${lastmod}</lastmod>\n`;
  if (changefreq) entry += `    <changefreq>${changefreq}</changefreq>\n`;
  if (priority) entry += `    <priority>${priority}</priority>\n`;
  entry += `  </url>\n`;
  return entry;
}

async function fetchAllRows(supabase, table, columns, orderBy = 'id') {
  const rows = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order(orderBy, { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error(`[sitemap] Failed fetching "${table}": ${error.message}`);
      break;
    }
    if (!data || data.length === 0) break;

    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

function shayariUrl(row) {
  const match = row.wordpress_url ? row.wordpress_url.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//) : null;
  if (match && row.slug) {
    return `${SITE_URL}/${match[1]}/${match[2]}/${match[3]}/${row.slug}`;
  }
  return `${SITE_URL}/shayari/${row.id}`;
}

function writeRobotsTxt() {
  const robots = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /admin-login',
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    '',
  ].join('\n');

  writeFileSync(join(PUBLIC_DIR, 'robots.txt'), robots);
  console.log('[sitemap] Wrote public/robots.txt');
}

function writeSitemapFiles(urls) {
  if (urls.length <= MAX_URLS_PER_SITEMAP) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('')}</urlset>\n`;
    writeFileSync(join(PUBLIC_DIR, 'sitemap.xml'), xml);
    console.log(`[sitemap] Wrote public/sitemap.xml (${urls.length} URLs)`);
    return;
  }

  // Google caps a single sitemap at 50,000 URLs — split into numbered
  // sitemap-N.xml files under a sitemap.xml index once we exceed that.
  const chunks = [];
  for (let i = 0; i < urls.length; i += MAX_URLS_PER_SITEMAP) {
    chunks.push(urls.slice(i, i + MAX_URLS_PER_SITEMAP));
  }

  const indexEntries = chunks.map((chunk, i) => {
    const filename = `sitemap-${i + 1}.xml`;
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${chunk.join('')}</urlset>\n`;
    writeFileSync(join(PUBLIC_DIR, filename), xml);
    return `  <sitemap>\n    <loc>${SITE_URL}/${filename}</loc>\n  </sitemap>\n`;
  });

  const indexXml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexEntries.join('')}</sitemapindex>\n`;
  writeFileSync(join(PUBLIC_DIR, 'sitemap.xml'), indexXml);
  console.log(`[sitemap] Wrote sitemap index (${chunks.length} files, ${urls.length} URLs total)`);
}

async function main() {
  mkdirSync(PUBLIC_DIR, { recursive: true });
  writeRobotsTxt();

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[sitemap] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — skipping sitemap.xml generation.');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const urls = [];

  // Static top-level pages (excludes /search — not a canonical content page)
  const staticPaths = [
    '/', '/explore', '/poets', '/topics', '/tags', '/collections', '/ebooks',
    '/about', '/privacy-policy', '/terms-and-conditions', '/dmca-copyright',
  ];
  staticPaths.forEach((p) => {
    urls.push(urlEntry(`${SITE_URL}${p}`, undefined, 'daily', p === '/' ? '1.0' : '0.7'));
  });

  const shayariRows = await fetchAllRows(supabase, 'shayari', 'id, slug, wordpress_url, updated_at, created_at');
  shayariRows.forEach((row) => {
    const lastmod = (row.updated_at || row.created_at || '').slice(0, 10) || undefined;
    urls.push(urlEntry(shayariUrl(row), lastmod, 'monthly', '0.8'));
  });

  const poetRows = await fetchAllRows(supabase, 'poets', 'slug');
  poetRows.forEach((row) => {
    if (row.slug) urls.push(urlEntry(`${SITE_URL}/poets/${row.slug}`, undefined, 'weekly', '0.6'));
  });

  const topicRows = await fetchAllRows(supabase, 'topics', 'slug');
  topicRows.forEach((row) => {
    if (row.slug) urls.push(urlEntry(`${SITE_URL}/topics/${row.slug}`, undefined, 'weekly', '0.6'));
  });

  const tagRows = await fetchAllRows(supabase, 'tags', 'slug');
  tagRows.forEach((row) => {
    if (row.slug) urls.push(urlEntry(`${SITE_URL}/tags/${row.slug}`, undefined, 'weekly', '0.5'));
  });

  // Collections and ebooks are routed by id, not slug (confirmed against App.tsx routes)
  const collectionRows = await fetchAllRows(supabase, 'collections', 'id');
  collectionRows.forEach((row) => {
    urls.push(urlEntry(`${SITE_URL}/collections/${row.id}`, undefined, 'weekly', '0.5'));
  });

  const ebookRows = await fetchAllRows(supabase, 'ebooks', 'id');
  ebookRows.forEach((row) => {
    urls.push(urlEntry(`${SITE_URL}/ebooks/${row.id}`, undefined, 'monthly', '0.5'));
  });

  // Dictionary pages are excluded: their routes are currently commented out
  // in App.tsx (unreachable), so including them would submit dead URLs.

  console.log(`[sitemap] Collected ${urls.length} URLs.`);
  writeSitemapFiles(urls);
}

main().catch((err) => {
  // Never fail the whole site build over sitemap generation.
  console.error('[sitemap] Generation failed:', err);
});
