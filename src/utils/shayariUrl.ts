import { Shayari } from '../services/api';

export function extractDateFromWordpressUrl(url?: string | null) {
  if (!url) return null;

  const match = url.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
  if (match) return { year: match[1], month: match[2], day: match[3] };
  return null;
}

export function getShayariUrl(shayari: Shayari) {
  const date = extractDateFromWordpressUrl(shayari.wordpress_url);
  if (date && shayari.slug) {
    return `/${date.year}/${date.month}/${date.day}/${shayari.slug}`;
  }

  return `/shayari/${shayari.id}`;
}
