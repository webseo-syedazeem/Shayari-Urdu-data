import { Helmet } from 'react-helmet-async';

interface SeoProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
}

const DEFAULT_TITLE = 'ShayariUrdu.com – Urdu, Roman Urdu, Hindi & English Shayari';
const DEFAULT_DESCRIPTION = 'Discover beautiful Urdu, Roman Urdu, Hindi and English shayari, ghazals, nazms and poetry quotes by your favorite poets. Browse by topics, moods, and collections.';
const DEFAULT_KEYWORDS = 'urdu shayari, roman urdu shayari, hindi shayari, poetry, quotes, ghazal, nazm, sher';
// TODO: swap for a proper 1200x630 PNG/JPG once one exists — favicon.webp is
// square and WebP, which some social platforms crop oddly or fail to render.
const DEFAULT_OG_IMAGE = '/favicon.webp';
const SITE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://shayariurdu.com';

export function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonical,
  ogImage,
  ogType = 'website'
}: SeoProps) {
  const pageTitle = title || DEFAULT_TITLE;
  const fullTitle = title && !title.includes('ShayariUrdu.com')
    ? `${title} | ShayariUrdu.com`
    : pageTitle;

  const pageDescription = description || DEFAULT_DESCRIPTION;
  const pageKeywords = keywords || DEFAULT_KEYWORDS;

  const canonicalUrl = canonical || (typeof window !== 'undefined' ? window.location.href : SITE_URL);

  const imageUrl = ogImage || DEFAULT_OG_IMAGE;
  const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${SITE_URL}${imageUrl}`;

  const twitterCard = ogImage ? 'summary_large_image' : 'summary';

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={pageDescription} />
      {pageKeywords && <meta name="keywords" content={pageKeywords} />}

      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:site_name" content="ShayariUrdu.com" />

      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={fullImageUrl} />
    </Helmet>
  );
}

function cleanForMetaDescription(text: string, maxLength = 157): string {
  const collapsed = text.replace(/\s+/g, ' ').trim();
  if (collapsed.length <= maxLength) return collapsed;
  return `${collapsed.slice(0, maxLength).trimEnd()}...`;
}

export function generateShayariSeo(shayari: any) {
  const versions: Array<{ language: string; text: string }> = shayari.shayari_language_versions || [];
  const romanVersion = versions.find((v) => v.language === 'roman_urdu' || v.language === 'roman');
  const bodyVersion = romanVersion || versions[0];
  const bodyText = bodyVersion?.text || '';

  const poetName = shayari.poets?.name || 'Unknown';
  const form = shayari.form || 'Shayari';

  // seo_title is a clean, purpose-written field — use it as-is when present.
  const title = shayari.seo_title
    || (bodyText ? `${bodyText.split(/\s+/).slice(0, 12).join(' ')}...` : `${form} by ${poetName}`);

  // seo_description on this table actually stores the raw multi-line, multi-script
  // poem text (used elsewhere to render the page body) — never pass it straight
  // into a meta description tag. Derive a clean single-line summary from the
  // parsed language version text instead, falling back to seo_description itself
  // (cleaned) only if no language version text is available at all.
  const description = bodyText
    ? cleanForMetaDescription(bodyText)
    : shayari.seo_description
      ? cleanForMetaDescription(shayari.seo_description)
      : `Beautiful ${form.toLowerCase()} by ${poetName}`;

  const keywords = shayari.seo_keywords || `${poetName}, ${form}, urdu shayari, poetry`;

  return {
    title,
    description,
    keywords,
    canonical: shayari.canonical_url || undefined,
    ogImage: shayari.featured_image_url || undefined
  };
}

export function generatePoetSeo(poet: any) {
  if (poet.seo_title || poet.seo_description || poet.seo_keywords) {
    return {
      title: poet.seo_title || undefined,
      description: poet.seo_description || undefined,
      keywords: poet.seo_keywords || undefined,
      ogImage: poet.avatar_url || undefined
    };
  }

  return {
    title: `${poet.name} Shayari`,
    description: poet.short_bio || `Explore beautiful shayari, ghazals, and nazms by ${poet.name} in Urdu, Roman Urdu, Hindi and English.`,
    keywords: `${poet.name}, Urdu Shayari, Ghazal, Nazm, Sher, Poetry`,
    ogImage: poet.avatar_url || undefined
  };
}

export function generateTopicSeo(topic: any) {
  if (topic.seo_title || topic.seo_description || topic.seo_keywords) {
    return {
      title: topic.seo_title || undefined,
      description: topic.seo_description || undefined,
      keywords: topic.seo_keywords || undefined
    };
  }

  return {
    title: `${topic.name} Shayari`,
    description: topic.description || `Best shayari on ${topic.name} in Urdu, Roman Urdu, Hindi and English`,
    keywords: `${topic.name}, shayari, urdu shayari, poetry`
  };
}

export function generateCollectionSeo(collection: any) {
  if (collection.seo_title || collection.seo_description || collection.seo_keywords) {
    return {
      title: collection.seo_title || undefined,
      description: collection.seo_description || undefined,
      keywords: collection.seo_keywords || undefined,
      ogImage: collection.cover_image || undefined
    };
  }

  return {
    title: collection.title,
    description: collection.description || `Curated collection of beautiful shayari - ${collection.title}`,
    keywords: `${collection.title}, shayari collection, urdu poetry`,
    ogImage: collection.cover_image || undefined
  };
}

export function generateEbookSeo(ebook: any) {
  if (ebook.seo_title || ebook.seo_description || ebook.seo_keywords) {
    return {
      title: ebook.seo_title || undefined,
      description: ebook.seo_description || undefined,
      keywords: ebook.seo_keywords || undefined,
      ogImage: ebook.cover_image || undefined
    };
  }

  const title = ebook.titles?.english || ebook.titles?.urdu || 'Ebook';
  const description = ebook.descriptions?.english || ebook.descriptions?.urdu || '';

  return {
    title: `${title} PDF/EPUB`,
    description: description || `Download ${title} - A collection of beautiful Urdu poetry and shayari`,
    keywords: `${title}, urdu ebook, poetry pdf, ${ebook.poet_name || 'shayari'}`,
    ogImage: ebook.cover_image || undefined
  };
}

export function generateDictionarySeo(entry: any) {
  if (entry.seo_title || entry.seo_description || entry.seo_keywords) {
    return {
      title: entry.seo_title || undefined,
      description: entry.seo_description || undefined,
      keywords: entry.seo_keywords || undefined
    };
  }

  const word = entry.word_english || entry.word_urdu || entry.word_key;
  const meanings = entry.meanings_english?.slice(0, 2).join(', ') || '';

  return {
    title: `${word} Meaning in Urdu & English`,
    description: meanings ? `${word}: ${meanings}` : `Find the meaning of ${word} in Urdu and English with examples and synonyms`,
    keywords: `${word}, meaning, urdu meaning, english meaning, dictionary`
  };
}
