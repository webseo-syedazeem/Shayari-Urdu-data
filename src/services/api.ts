const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3001';

async function apiFetch<T = any>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers }
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(err.error || err.message || `HTTP ${response.status}`);
  }
  return response.json();
}

function buildQuery(params: Record<string, any>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  }
  return q.toString() ? `?${q.toString()}` : '';
}

const urduScriptRegex = /[\u0600-\u06FF]/;

function parseSeoDescriptionVersions(seoDescription?: string | null) {
  if (!seoDescription) return [];

  const parts = seoDescription
    .split('\n\n')
    .map((part) => part.trim())
    .filter(Boolean);

  const romanLines = parts.filter((part) => !urduScriptRegex.test(part));
  const urduLines = parts.filter((part) => urduScriptRegex.test(part));
  const versions: Array<{ language: string; text: string }> = [];

  if (romanLines.length > 0) {
    versions.push({ language: 'roman_urdu', text: romanLines.join('\n') });
  }

  if (urduLines.length > 0) {
    versions.push({ language: 'urdu', text: urduLines.join('\n') });
  }

  return versions;
}

export interface Poet {
  id: string;
  name: string;
  slug: string;
  short_bio: string;
  long_bio: string;
  primary_language: string;
  avatar_url: string;
  country: string;
  birth_year: number;
  death_year: number | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
}

export interface Shayari {
  id: string;
  poet_id: string;
  form: string;
  is_trending: boolean;
  is_featured: boolean;
  is_poetry_of_the_day: boolean;
  popularity_score: number;
  created_at: string;
  updated_at?: string | null;
  slug?: string | null;
  title?: string | null;
  source?: string | null;
  wordpress_post_id?: number | null;
  wordpress_url?: string | null;
  canonical_url?: string | null;
  featured_image_url?: string | null;
  featured_image_alt?: string | null;
  wordpress_featured_image_id?: number | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  poets?: Poet;
  shayari_language_versions?: Array<{ language: string; text: string }>;
}

export interface Topic {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  count?: number;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
}

export interface Collection {
  id: string;
  title: string;
  slug: string;
  description: string;
  cover_image: string;
  is_featured: boolean;
  itemCount?: number;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
}

export interface Ebook {
  id: string;
  slug: string;
  poet_id: string | null;
  poet_name: string;
  titles: Record<string, string>;
  descriptions: Record<string, string>;
  cover_image: string;
  pages: number;
  file_url_pdf: string | null;
  file_url_epub: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
}

export interface DictionaryEntry {
  id: string;
  word_key: string;
  word_urdu: string | null;
  word_roman: string | null;
  word_hindi: string | null;
  word_english: string | null;
  part_of_speech: string | null;
  pronunciation: string | null;
  meanings_english: string[];
  meanings_urdu: string[];
  notes: string | null;
  synonyms: string[];
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  wordpress_tag_id?: number | null;
  count?: number;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
}

class ApiService {
  async getPoets(params?: { page?: number; pageSize?: number; search?: string }) {
    const qs = buildQuery({ page: params?.page, pageSize: params?.pageSize, search: params?.search });
    return apiFetch<{ data: Poet[]; pagination: any }>(`/api/poets${qs}`);
  }

  async getPoet(slug: string) {
    const data = await apiFetch<any>(`/api/poets/${encodeURIComponent(slug)}`);
    const total = typeof data.shayariCounts === 'object'
      ? Object.values(data.shayariCounts as Record<string, number>).reduce((a, b) => a + b, 0)
      : 0;
    return { ...data, shayariCounts: { total, ...data.shayariCounts } };
  }

  async getPoetById(id: string) {
    try {
      const data = await apiFetch<any>(`/api/poets/by-id/${encodeURIComponent(id)}`);
      const total = typeof data.shayariCounts === 'object'
        ? Object.values(data.shayariCounts as Record<string, number>).reduce((a, b) => a + b, 0)
        : 0;
      return { ...data, shayariCounts: { total, ...data.shayariCounts } };
    } catch {
      return null;
    }
  }

  async getShayari(params?: { page?: number; pageSize?: number; language?: string; form?: string; mood?: string; length?: string; topic?: string; sort?: 'trending' | 'mostLoved' | 'latest'; poetId?: string; search?: string; is_trending?: boolean | null; is_featured?: boolean | null }) {
    const qs = buildQuery({
      page: params?.page,
      pageSize: params?.pageSize,
      language: params?.language,
      form: params?.form,
      mood: params?.mood,
      length: params?.length,
      topic: params?.topic,
      sort: params?.sort,
      poetId: params?.poetId,
      q: params?.search,
      is_trending: params?.is_trending,
      is_featured: params?.is_featured
    });
    return apiFetch<{ data: Shayari[]; pagination: any }>(`/api/shayari${qs}`);
  }

  async getPoetryOfTheDay(params?: { page?: number; pageSize?: number }) {
    const qs = buildQuery({ page: params?.page, pageSize: params?.pageSize });
    return apiFetch<{ data: Shayari[]; pagination: any }>(`/api/shayari/poetry-of-the-day${qs}`);
  }

  async getShayariById(id: string) {
    const data = await apiFetch<any>(`/api/shayari/${encodeURIComponent(id)}`);
    return this.normalizeShayariDetail(data);
  }

  async getShayariBySlug(slug: string) {
    const data = await apiFetch<any>(`/api/shayari/by-slug?slug=${encodeURIComponent(slug)}`);
    return this.normalizeShayariDetail(data);
  }

  private normalizeShayariDetail(data: any) {
    const seoDescriptionVersions = parseSeoDescriptionVersions(data.seo_description);
    const shayariLanguageVersions = seoDescriptionVersions.length > 0
      ? seoDescriptionVersions
      : data.shayari_language_versions || [];

    return {
      ...data,
      shayari_language_versions: shayariLanguageVersions,
      languageVersions: shayariLanguageVersions,
      topics: data.topics || [],
      relatedShayari: data.relatedShayari || []
    };
  }

  async getTopics() {
    return apiFetch<{ data: Topic[] }>('/api/topics');
  }

  async getTopic(slug: string) {
    return apiFetch<any>(`/api/topics/${encodeURIComponent(slug)}`);
  }

  async getTags() {
    return apiFetch<{ data: Tag[] }>('/api/tags');
  }

  async getTag(slug: string) {
    return apiFetch<any>(`/api/tags/${encodeURIComponent(slug)}`);
  }

  async getCollections(params?: { page?: number; pageSize?: number }) {
    const qs = buildQuery({ page: params?.page, pageSize: params?.pageSize });
    return apiFetch<{ data: Collection[]; pagination: any }>(`/api/collections${qs}`);
  }

  async getCollection(slug: string) {
    return apiFetch<any>(`/api/collections/${encodeURIComponent(slug)}`);
  }

  async getCollectionById(id: string) {
    try {
      return apiFetch<any>(`/api/collections/by-id/${encodeURIComponent(id)}`);
    } catch {
      return null;
    }
  }

  async getEbooks(params?: { page?: number; pageSize?: number; poetId?: string }) {
    const qs = buildQuery({ page: params?.page, pageSize: params?.pageSize, poetId: params?.poetId });
    return apiFetch<{ data: Ebook[]; pagination: any }>(`/api/ebooks${qs}`);
  }

  async getEbook(slug: string) {
    return apiFetch<Ebook>(`/api/ebooks/${encodeURIComponent(slug)}`);
  }

  async getEbookById(id: string) {
    try {
      return apiFetch<Ebook>(`/api/ebooks/by-id/${encodeURIComponent(id)}`);
    } catch {
      return null;
    }
  }

  async getDictionaryEntries(params?: { search?: string; query?: string; page?: number; pageSize?: number }) {
    const searchTerm = params?.search || params?.query;
    const qs = buildQuery({ query: searchTerm, page: params?.page, pageSize: params?.pageSize });
    return apiFetch<{ data: DictionaryEntry[]; pagination: any }>(`/api/dictionary${qs}`);
  }

  async getDictionaryEntry(wordKey: string) {
    return apiFetch<DictionaryEntry>(`/api/dictionary/${encodeURIComponent(wordKey)}`);
  }

  async getDictionaryEntryById(id: string) {
    try {
      return apiFetch<DictionaryEntry>(`/api/dictionary/by-id/${encodeURIComponent(id)}`);
    } catch {
      return null;
    }
  }

  async getChatMessages(shayariId: string, params?: { page?: number; pageSize?: number }) {
    const qs = buildQuery({ page: params?.page, pageSize: params?.pageSize });
    return apiFetch<{ data: any[]; pagination: any }>(`/api/shayari/${encodeURIComponent(shayariId)}/chat${qs}`);
  }

  async getAdSlots() {
    return apiFetch<{ data: any[] }>('/api/ad-slots');
  }

  async getAdSlot(key: string) {
    return apiFetch<any>(`/api/ad-slots/${encodeURIComponent(key)}`);
  }
}

export const api = new ApiService();
