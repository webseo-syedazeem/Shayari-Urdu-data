/*
 * PUBLIC API SERVICE
 *
 * This file is the only integration point for public-facing data access.
 * Currently uses direct Supabase client (VITE_DATA_SOURCE=bolt).
 *
 * FUTURE MIGRATION: When VITE_DATA_SOURCE=node, this file will be updated to call
 * Node.js REST API endpoints instead of direct database access. UI components will
 * remain unchanged as they depend only on this service interface.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const dataSource = import.meta.env.VITE_DATA_SOURCE || 'bolt';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

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
  popularity_score: number;
  created_at: string;
  slug?: string | null;
  featured_image_url?: string;
  featured_image_alt?: string;
  wordpress_featured_image_id?: number | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  poets?: Poet;
  shayari_language_versions?: Array<{
    language: string;
    text: string;
  }>;
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
    let query = supabase.from('poets').select('*').order('name');

    if (params?.search) {
      query = query.ilike('name', `%${params.search}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return { data: data || [], pagination: {} };
  }

  async getPoet(slug: string) {
    const { data: poet, error } = await supabase
      .from('poets')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw new Error(error.message);

    const { count } = await supabase
      .from('shayari')
      .select('*', { count: 'exact', head: true })
      .eq('poet_id', poet.id);

    const { data: popularShayari } = await supabase
      .from('shayari')
      .select('id')
      .eq('poet_id', poet.id)
      .order('popularity_score', { ascending: false })
      .limit(5);

    return {
      ...poet,
      shayariCounts: { total: count || 0 },
      popularShayariIds: popularShayari?.map(s => s.id) || []
    };
  }

  async getPoetById(id: string) {
    const { data: poet, error } = await supabase
      .from('poets')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!poet) return null;

    const { count } = await supabase
      .from('shayari')
      .select('*', { count: 'exact', head: true })
      .eq('poet_id', poet.id);

    const { data: popularShayari } = await supabase
      .from('shayari')
      .select('id')
      .eq('poet_id', poet.id)
      .order('popularity_score', { ascending: false })
      .limit(5);

    return {
      ...poet,
      shayariCounts: { total: count || 0 },
      popularShayariIds: popularShayari?.map(s => s.id) || []
    };
  }

  async getShayari(params?: {
    page?: number;
    pageSize?: number;
    language?: string;
    form?: string;
    topic?: string;
    sort?: 'trending' | 'mostLoved' | 'latest';
    poetId?: string;
    search?: string;
  }) {
    let query = supabase
      .from('shayari')
      .select(`
        *,
        poets (id, name, slug, avatar_url),
        shayari_language_versions (language, text)
      `);

    if (params?.poetId) {
      query = query.eq('poet_id', params.poetId);
    }

    if (params?.form) {
      query = query.eq('form', params.form);
    }

    if (params?.search) {
      query = query.or(`id.eq.${params.search}`);
    }

    if (params?.sort === 'trending') {
      query = query.eq('is_trending', true);
    } else if (params?.sort === 'mostLoved') {
      query = query.order('popularity_score', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const pageSize = params?.pageSize || 20;
    const page = params?.page || 1;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.range(from, to);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return { data: data || [], pagination: { page, pageSize } };
  }

  async getShayariById(id: string) {
    const { data: shayari, error } = await supabase
      .from('shayari')
      .select(`
        *,
        poets (id, name, slug, avatar_url),
        shayari_language_versions (language, text)
      `)
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);

    const { data: relatedShayari } = await supabase
      .from('shayari')
      .select(`
        *,
        poets (id, name, slug, avatar_url),
        shayari_language_versions (language, text)
      `)
      .eq('poet_id', shayari.poet_id)
      .neq('id', id)
      .limit(5);

    return {
      ...shayari,
      languageVersions: shayari.shayari_language_versions || [],
      topics: [],
      relatedShayari: relatedShayari || []
    };
  }

  async getTopics() {
    const { data: topics, error } = await supabase
      .from('topics')
      .select('*')
      .order('name');

    if (error) throw new Error(error.message);

    const topicsWithCounts = await Promise.all(
      (topics || []).map(async (topic) => {
        const { count } = await supabase
          .from('shayari_topics')
          .select('*', { count: 'exact', head: true })
          .eq('topic_id', topic.id);

        return { ...topic, count: count || 0 };
      })
    );

    return { data: topicsWithCounts };
  }

  async getTopic(slug: string) {
    const { data: topic, error } = await supabase
      .from('topics')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!topic) throw new Error('Topic not found');

    const { data: shayariTopics } = await supabase
      .from('shayari_topics')
      .select('shayari_id')
      .eq('topic_id', topic.id);

    const shayariIds = shayariTopics?.map(st => st.shayari_id) || [];

    let shayari: any[] = [];
    if (shayariIds.length > 0) {
      const { data } = await supabase
        .from('shayari')
        .select(`
          *,
          poets (id, name, slug, avatar_url),
          shayari_language_versions (language, text)
        `)
        .in('id', shayariIds);
      shayari = data || [];
    }

    return { ...topic, shayari, pagination: {} };
  }

  async getTags() {
    const { data: tags, error } = await supabase
      .from('tags')
      .select('*')
      .order('name');

    if (error) throw new Error(error.message);

    const tagsWithCounts = await Promise.all(
      (tags || []).map(async (tag) => {
        const { count } = await supabase
          .from('shayari_tags')
          .select('*', { count: 'exact', head: true })
          .eq('tag_id', tag.id);

        return { ...tag, count: count || 0 };
      })
    );

    return { data: tagsWithCounts };
  }

  async getTag(slug: string) {
    const { data: tag, error } = await supabase
      .from('tags')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!tag) throw new Error('Tag not found');

    const { data: shayariTags } = await supabase
      .from('shayari_tags')
      .select('shayari_id')
      .eq('tag_id', tag.id);

    const shayariIds = shayariTags?.map(st => st.shayari_id) || [];

    let shayari: any[] = [];
    if (shayariIds.length > 0) {
      const { data } = await supabase
        .from('shayari')
        .select(`
          *,
          poets (id, name, slug, avatar_url),
          shayari_language_versions (language, text)
        `)
        .in('id', shayariIds);
      shayari = data || [];
    }

    return { ...tag, shayari, pagination: {} };
  }

  async getCollections(params?: { page?: number; pageSize?: number }) {
    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        collection_items (count)
      `)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    const collectionsWithCounts = (data || []).map((collection: any) => ({
      ...collection,
      itemCount: collection.collection_items?.[0]?.count || 0
    }));

    return { data: collectionsWithCounts, pagination: {} };
  }

  async getCollection(slug: string) {
    const { data: collection, error } = await supabase
      .from('collections')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw new Error(error.message);

    const { data: collectionItems } = await supabase
      .from('collection_items')
      .select('shayari_id')
      .eq('collection_id', collection.id)
      .order('sort_order');

    const shayariIds = collectionItems?.map(ci => ci.shayari_id) || [];

    let items: any[] = [];
    if (shayariIds.length > 0) {
      const { data } = await supabase
        .from('shayari')
        .select(`
          *,
          poets (id, name, slug, avatar_url),
          shayari_language_versions (language, text)
        `)
        .in('id', shayariIds);
      items = data || [];
    }

    return { ...collection, items, pagination: {} };
  }

  async getCollectionById(id: string) {
    const { data: collection, error } = await supabase
      .from('collections')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return collection;
  }

  async getEbooks(params?: { page?: number; pageSize?: number; poetId?: string }) {
    let query = supabase
      .from('ebooks')
      .select('*')
      .order('created_at', { ascending: false });

    if (params?.poetId) {
      query = query.eq('poet_id', params.poetId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return { data: data || [], pagination: {} };
  }

  async getEbook(slug: string) {
    const { data, error } = await supabase
      .from('ebooks')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw new Error(error.message);

    return data;
  }

  async getEbookById(id: string) {
    const { data, error } = await supabase
      .from('ebooks')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);

    return data;
  }

  async getDictionaryEntries(params?: { search?: string; query?: string; page?: number; pageSize?: number }) {
    let query = supabase
      .from('dictionary_entries')
      .select('*')
      .order('word_key');

    const searchTerm = params?.search || params?.query;
    if (searchTerm) {
      query = query.or(`word_key.ilike.%${searchTerm}%,word_roman.ilike.%${searchTerm}%,word_english.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return { data: data || [], pagination: {} };
  }

  async getDictionaryEntry(wordKey: string) {
    const { data, error } = await supabase
      .from('dictionary_entries')
      .select('*')
      .eq('word_key', wordKey)
      .single();

    if (error) throw new Error(error.message);

    return data;
  }

  async getDictionaryEntryById(id: string) {
    const { data, error } = await supabase
      .from('dictionary_entries')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);

    return data;
  }

  async getChatMessages(shayariId: string, params?: { page?: number; pageSize?: number }) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('shayari_id', shayariId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return { data: data || [], pagination: {} };
  }

  async getAdSlots() {
    const { data, error } = await supabase
      .from('ad_slots')
      .select('*')
      .eq('is_active', true);

    if (error) throw new Error(error.message);

    return { data: data || [] };
  }

  async getAdSlot(key: string) {
    const { data, error } = await supabase
      .from('ad_slots')
      .select('*')
      .eq('slot_key', key)
      .eq('is_active', true)
      .single();

    if (error) throw new Error(error.message);

    return data;
  }
}

export const api = new ApiService();
