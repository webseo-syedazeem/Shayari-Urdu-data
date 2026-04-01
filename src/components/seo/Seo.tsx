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
const DEFAULT_OG_IMAGE = '/og-image.png';
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

export function generateShayariSeo(shayari: any) {
  if (shayari.seo_title || shayari.seo_description || shayari.seo_keywords) {
    return {
      title: shayari.seo_title || undefined,
      description: shayari.seo_description || undefined,
      keywords: shayari.seo_keywords || undefined,
      ogImage: shayari.featured_image_url || undefined
    };
  }

  const firstVersion = shayari.shayari_language_versions?.[0];
  const text = firstVersion?.text || '';
  const words = text.split(' ').slice(0, 12).join(' ');
  const truncatedText = text.length > 160 ? text.substring(0, 157) + '...' : text;

  const poetName = shayari.poets?.name || 'Unknown';
  const form = shayari.form || 'Shayari';

  return {
    title: words ? `${words}...` : `${form} by ${poetName}`,
    description: truncatedText || `Beautiful ${form.toLowerCase()} by ${poetName}`,
    keywords: `${poetName}, ${form}, urdu shayari, poetry`,
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
