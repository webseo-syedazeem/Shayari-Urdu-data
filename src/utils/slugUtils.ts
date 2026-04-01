/**
 * Utility functions for generating slugs from text content
 */

/**
 * Generate a slug from text (lowercase, hyphenated, no special chars)
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate a slug for shayari from poet name and text
 * @param poetName - Name of the poet
 * @param text - Shayari text (preferably roman_urdu)
 * @param maxWords - Maximum number of words to use from text (default: 8)
 */
export function generateShayariSlug(poetName: string, text: string, maxWords: number = 8): string {
  if (!text) {
    return generateSlug(poetName || 'shayari');
  }

  // Extract first N words from text
  const words = text
    .trim()
    .split(/\s+/)
    .slice(0, maxWords);

  // Combine poet name with text words
  const slugText = poetName
    ? `${poetName} ${words.join(' ')}`
    : words.join(' ');

  return generateSlug(slugText);
}

/**
 * Generate a slug for ebook from title
 * @param titles - Ebook titles object (romanUrdu, urdu, english, etc.)
 */
export function generateEbookSlug(titles: any): string {
  const title = titles?.romanUrdu || titles?.english || titles?.urdu || 'ebook';
  const slug = generateSlug(title);
  // Ensure we always return a non-empty slug
  return slug || 'ebook-' + Math.random().toString(36).substring(2, 8);
}

/**
 * Generate a unique slug by appending a random suffix
 * @param baseSlug - The base slug
 */
export function makeSlugUnique(baseSlug: string): string {
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${baseSlug}-${randomSuffix}`;
}

/**
 * Normalize word_key for dictionary (lowercase, spaces to hyphens)
 */
export function normalizeWordKey(wordKey: string): string {
  return wordKey
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '') // Remove special chars except hyphens
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}
