/*
 * ADMIN API SERVICE
 *
 * This file is the only integration point for admin CRUD operations.
 * Currently uses direct Supabase client (VITE_DATA_SOURCE=bolt).
 *
 * FUTURE MIGRATION: When VITE_DATA_SOURCE=node, this file will be updated to call
 * Node.js REST API endpoints instead of direct database access. Admin UI components
 * will remain unchanged as they depend only on this service interface.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const dataSource = import.meta.env.VITE_DATA_SOURCE || 'bolt';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

export const adminApi = {
  get: async <T = any>(endpoint: string): Promise<T> => {
    console.log('Admin API GET:', endpoint);

    if (endpoint.startsWith('/poets')) {
      const parts = endpoint.split('/');
      if (parts.length === 3 && parts[2]) {
        // GET /poets/:id
        const { data, error } = await supabase
          .from('poets')
          .select('*')
          .eq('id', parts[2])
          .single();

        if (error) throw new Error(error.message);
        return data as T;
      } else {
        // GET /poets
        const { data, error } = await supabase
          .from('poets')
          .select('*')
          .order('name');

        if (error) throw new Error(error.message);
        return data as T;
      }
    } else if (endpoint.startsWith('/shayari')) {
      const parts = endpoint.split('/');
      if (parts.length === 3 && parts[2]) {
        // GET /shayari/:id
        const { data, error } = await supabase
          .from('shayari')
          .select(`
            *,
            poets (name),
            shayari_language_versions (language, text)
          `)
          .eq('id', parts[2])
          .single();

        if (error) throw new Error(error.message);

        // Fetch selected topics
        const { data: shayariTopics } = await supabase
          .from('shayari_topics')
          .select('topic_id')
          .eq('shayari_id', parts[2]);
        const topic_ids = shayariTopics?.map(st => st.topic_id) || [];

        // Fetch selected tags
        const { data: shayariTags } = await supabase
          .from('shayari_tags')
          .select('tag_id')
          .eq('shayari_id', parts[2]);
        const tag_ids = shayariTags?.map(st => st.tag_id) || [];

        console.log('Loaded shayari with topic_ids:', topic_ids, 'tag_ids:', tag_ids);
        return { ...data, topic_ids, tag_ids } as T;
      } else {
        // GET /shayari
        const { data, error } = await supabase
          .from('shayari')
          .select(`
            *,
            poets (name),
            shayari_language_versions (language, text)
          `)
          .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return data as T;
      }
    } else if (endpoint.startsWith('/ebooks')) {
      const parts = endpoint.split('/');
      if (parts.length === 3 && parts[2]) {
        // GET /ebooks/:id
        const { data, error } = await supabase
          .from('ebooks')
          .select('*')
          .eq('id', parts[2])
          .single();

        if (error) throw new Error(error.message);
        return data as T;
      } else {
        // GET /ebooks
        const { data, error } = await supabase
          .from('ebooks')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return data as T;
      }
    } else if (endpoint.startsWith('/dictionary')) {
      const parts = endpoint.split('/');
      if (parts.length === 3 && parts[2]) {
        // GET /dictionary/:id
        const { data, error } = await supabase
          .from('dictionary_entries')
          .select('*')
          .eq('id', parts[2])
          .single();

        if (error) throw new Error(error.message);
        return data as T;
      } else {
        // GET /dictionary
        const { data, error } = await supabase
          .from('dictionary_entries')
          .select('*')
          .order('word_key');

        if (error) throw new Error(error.message);
        return data as T;
      }
    } else if (endpoint.startsWith('/collections')) {
      const parts = endpoint.split('/');
      if (parts.length === 3 && parts[2]) {
        // GET /collections/:id
        const { data, error } = await supabase
          .from('collections')
          .select('*')
          .eq('id', parts[2])
          .single();

        if (error) throw new Error(error.message);
        return data as T;
      } else {
        // GET /collections
        const { data, error } = await supabase
          .from('collections')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return data as T;
      }
    } else if (endpoint.startsWith('/ad-slots')) {
      const parts = endpoint.split('/');
      if (parts.length === 3 && parts[2]) {
        // GET /ad-slots/:id
        const { data, error } = await supabase
          .from('ad_slots')
          .select('*')
          .eq('id', parts[2])
          .single();

        if (error) throw new Error(error.message);
        return data as T;
      } else {
        // GET /ad-slots
        const { data, error } = await supabase
          .from('ad_slots')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw new Error(error.message);
        return { data } as T;
      }
    } else if (endpoint.startsWith('/tags')) {
      const parts = endpoint.split('/');
      if (parts.length === 3 && parts[2]) {
        // GET /tags/:id
        const { data, error } = await supabase
          .from('tags')
          .select('*')
          .eq('id', parts[2])
          .single();

        if (error) throw new Error(error.message);
        return data as T;
      } else {
        // GET /tags
        const { data, error } = await supabase
          .from('tags')
          .select('*')
          .order('name');

        if (error) throw new Error(error.message);
        return data as T;
      }
    } else if (endpoint.startsWith('/topics')) {
      const parts = endpoint.split('/');
      if (parts.length === 3 && parts[2]) {
        // GET /topics/:id
        const { data, error} = await supabase
          .from('topics')
          .select('*')
          .eq('id', parts[2])
          .single();

        if (error) throw new Error(error.message);
        return data as T;
      } else {
        // GET /topics
        const { data, error } = await supabase
          .from('topics')
          .select('*')
          .order('name');

        if (error) throw new Error(error.message);
        return data as T;
      }
    }

    throw new Error(`Unsupported GET endpoint: ${endpoint}`);
  },

  post: async <T = any>(endpoint: string, body: any): Promise<T> => {
    console.log('Admin API POST:', endpoint, body);

    if (endpoint === '/poets') {
      // Create poet
      if (!body.name) {
        throw new Error('Name is required');
      }

      // Auto-generate slug if missing
      let finalSlug = body.slug && body.slug.trim() ? body.slug.trim() : generateSlug(body.name);

      // Try up to 5 times with random suffix if slug exists
      for (let attempt = 0; attempt < 5; attempt++) {
        const currentSlug = attempt === 0 ? finalSlug : `${finalSlug}-${Math.random().toString(36).substring(2, 6)}`;

        const { data, error } = await supabase
          .from('poets')
          .insert({
            name: body.name,
            slug: currentSlug,
            short_bio: body.short_bio || '',
            long_bio: body.long_bio || '',
            primary_language: body.primary_language || 'roman_urdu',
            avatar_url: body.avatar_url || '',
            country: body.country || '',
            birth_year: body.birth_year || null,
            death_year: body.death_year || null,
            wordpress_id: body.wordpress_id || null,
            seo_title: body.seo_title?.trim() || null,
            seo_description: body.seo_description?.trim() || null,
            seo_keywords: body.seo_keywords?.trim() || null
          })
          .select()
          .single();

        if (!error) {
          console.log('Poet created successfully:', data);
          return data as T;
        }

        // If not a duplicate key error, throw immediately
        if (error.code !== '23505') {
          throw new Error(error.message || error.hint || 'Failed to create poet');
        }

        // Try again with new suffix
      }

      throw new Error('Failed to create poet: slug already exists');
    } else if (endpoint === '/shayari') {
      // Create shayari
      if (!body.poet_id) {
        throw new Error('Poet is required');
      }

      // Filter out empty languages
      const filteredLanguages: Record<string, string> = {};
      if (body.languages && typeof body.languages === 'object') {
        Object.entries(body.languages).forEach(([key, value]) => {
          if (value && typeof value === 'string' && value.trim()) {
            filteredLanguages[key] = value.trim();
          }
        });
      }

      if (Object.keys(filteredLanguages).length === 0) {
        throw new Error('At least one language version is required');
      }

      const { data: shayari, error: shayariError } = await supabase
        .from('shayari')
        .insert({
          slug: body.slug || null,
          poet_id: body.poet_id,
          form: body.form || 'sher',
          is_trending: body.is_trending || false,
          is_featured: body.is_featured || false,
          popularity_score: body.popularity_score || 0,
          featured_image_url: body.featured_image_url || null,
          featured_image_alt: body.featured_image_alt || null,
          wordpress_featured_image_id: body.wordpress_featured_image_id || null,
          seo_title: body.seo_title?.trim() || null,
          seo_description: body.seo_description?.trim() || null,
          seo_keywords: body.seo_keywords?.trim() || null
        })
        .select()
        .single();

      if (shayariError) throw new Error(shayariError.message || 'Failed to create shayari');

      // Insert language versions
      const languageVersions = Object.entries(filteredLanguages).map(([language, text]) => ({
        shayari_id: shayari.id,
        language,
        text
      }));

      const { error: versionsError } = await supabase
        .from('shayari_language_versions')
        .insert(languageVersions);

      if (versionsError) throw new Error(versionsError.message || 'Failed to create language versions');

      // Insert topics join rows
      let topicsInserted = 0;
      if (body.topics && Array.isArray(body.topics) && body.topics.length > 0) {
        const topicLinks = body.topics.map((topicId: string) => ({
          shayari_id: shayari.id,
          topic_id: topicId
        }));
        console.log('Inserting topic links:', topicLinks);
        const { error: topicsError } = await supabase
          .from('shayari_topics')
          .insert(topicLinks);
        if (topicsError) throw new Error(topicsError.message || 'Failed to link topics');
        topicsInserted = topicLinks.length;
      }

      // Insert tags join rows
      let tagsInserted = 0;
      if (body.tags && Array.isArray(body.tags) && body.tags.length > 0) {
        const tagLinks = body.tags.map((tagId: string) => ({
          shayari_id: shayari.id,
          tag_id: tagId
        }));
        console.log('Inserting tag links:', tagLinks);
        const { error: tagsError } = await supabase
          .from('shayari_tags')
          .insert(tagLinks);
        if (tagsError) throw new Error(tagsError.message || 'Failed to link tags');
        tagsInserted = tagLinks.length;
      }

      console.log('Shayari created successfully:', shayari, 'topics:', topicsInserted, 'tags:', tagsInserted);
      return { ...shayari, _debug: { topicsInserted, tagsInserted } } as T;
    } else if (endpoint === '/ebooks') {
      // Create ebook - slug should be generated on client side before calling this
      if (!body.slug) {
        throw new Error('Slug is required (should be generated on client before calling API)');
      }

      const { data, error} = await supabase
        .from('ebooks')
        .insert({
          slug: body.slug,
          poet_id: body.poet_id || null,
          poet_name: body.poet_name || null,
          titles: body.titles || {},
          descriptions: body.descriptions || {},
          cover_image: body.cover_image || null,
          pages: body.pages || 0,
          file_url_pdf: body.file_url_pdf || null,
          file_url_epub: body.file_url_epub || null,
          seo_title: body.seo_title?.trim() || null,
          seo_description: body.seo_description?.trim() || null,
          seo_keywords: body.seo_keywords?.trim() || null
        })
        .select()
        .single();

      if (error) {
        // Check if it's a unique constraint violation on slug
        if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
          throw new Error('Slug already exists. Please use a different slug.');
        }
        throw new Error(error.message || 'Failed to create ebook');
      }
      console.log('Ebook created successfully:', data);
      return data as T;
    } else if (endpoint === '/dictionary') {
      // Create dictionary entry
      if (!body.word_key) {
        throw new Error('Word key is required');
      }

      const { data, error } = await supabase
        .from('dictionary_entries')
        .insert({
          word_key: body.word_key,
          word_urdu: body.word_urdu || null,
          word_roman: body.word_roman || null,
          word_hindi: body.word_hindi || null,
          word_english: body.word_english || null,
          meanings_english: body.meanings_english || [],
          meanings_urdu: body.meanings_urdu || [],
          part_of_speech: body.part_of_speech || null,
          pronunciation: body.pronunciation || null,
          notes: body.notes || null,
          seo_title: body.seo_title?.trim() || null,
          seo_description: body.seo_description?.trim() || null,
          seo_keywords: body.seo_keywords?.trim() || null
        })
        .select()
        .single();

      if (error) throw new Error(error.message || 'Failed to create dictionary entry');
      console.log('Dictionary entry created successfully:', data);
      return data as T;
    } else if (endpoint === '/collections') {
      // Create collection
      if (!body.title) {
        throw new Error('Title is required');
      }

      let finalSlug = body.slug && body.slug.trim() ? body.slug.trim() : generateSlug(body.title);

      for (let attempt = 0; attempt < 5; attempt++) {
        const currentSlug = attempt === 0 ? finalSlug : `${finalSlug}-${Math.random().toString(36).substring(2, 6)}`;

        const { data, error } = await supabase
          .from('collections')
          .insert({
            title: body.title,
            slug: currentSlug,
            description: body.description || null,
            cover_image: body.cover_image || null,
            is_featured: body.is_featured || false,
            seo_title: body.seo_title?.trim() || null,
            seo_description: body.seo_description?.trim() || null,
            seo_keywords: body.seo_keywords?.trim() || null
          })
          .select()
          .single();

        if (!error) {
          console.log('Collection created successfully:', data);
          return data as T;
        }

        if (error.code !== '23505') {
          throw new Error(error.message || 'Failed to create collection');
        }
      }

      throw new Error('Failed to create collection: slug already exists');
    } else if (endpoint === '/ad-slots') {
      // Create ad slot
      if (!body.key) {
        throw new Error('Key is required');
      }
      if (!body.placement) {
        throw new Error('Placement is required');
      }
      if (!body.page_scope) {
        throw new Error('Page scope is required');
      }

      const { data, error } = await supabase
        .from('ad_slots')
        .insert({
          key: body.key,
          title: body.title || '',
          description: body.description || null,
          placement: body.placement,
          page_scope: body.page_scope,
          is_active: body.is_active !== undefined ? body.is_active : true,
          priority: body.priority !== undefined ? body.priority : 100,
          frequency: body.frequency !== undefined ? body.frequency : 6,
          html_snippet: body.html_snippet || null
        })
        .select()
        .single();

      if (error) {
        if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
          throw new Error('Ad slot key already exists. Please use a different key.');
        }
        throw new Error(error.message || 'Failed to create ad slot');
      }
      console.log('Ad slot created successfully:', data);
      return data as T;
    } else if (endpoint === '/tags') {
      // Create tag
      if (!body.name) {
        throw new Error('Name is required');
      }

      let finalSlug = body.slug && body.slug.trim() ? body.slug.trim() : generateSlug(body.name);

      for (let attempt = 0; attempt < 5; attempt++) {
        const currentSlug = attempt === 0 ? finalSlug : `${finalSlug}-${Math.random().toString(36).substring(2, 6)}`;

        const { data, error } = await supabase
          .from('tags')
          .insert({
            name: body.name,
            slug: currentSlug,
            description: body.description || null,
            seo_title: body.seo_title?.trim() || null,
            seo_description: body.seo_description?.trim() || null,
            seo_keywords: body.seo_keywords?.trim() || null
          })
          .select()
          .single();

        if (!error) {
          console.log('Tag created successfully:', data);
          return data as T;
        }

        if (error.code !== '23505') {
          throw new Error(error.message || 'Failed to create tag');
        }
      }

      throw new Error('Failed to create tag with unique slug after 5 attempts');
    } else if (endpoint === '/topics') {
      // Create topic
      if (!body.name) {
        throw new Error('Name is required');
      }

      let finalSlug = body.slug && body.slug.trim() ? body.slug.trim() : generateSlug(body.name);

      for (let attempt = 0; attempt < 5; attempt++) {
        const currentSlug = attempt === 0 ? finalSlug : `${finalSlug}-${Math.random().toString(36).substring(2, 6)}`;

        const { data, error } = await supabase
          .from('topics')
          .insert({
            name: body.name,
            slug: currentSlug,
            description: body.description || null,
            seo_title: body.seo_title?.trim() || null,
            seo_description: body.seo_description?.trim() || null,
            seo_keywords: body.seo_keywords?.trim() || null
          })
          .select()
          .single();

        if (!error) {
          console.log('Topic created successfully:', data);
          return data as T;
        }

        if (error.code !== '23505') {
          throw new Error(error.message || 'Failed to create topic');
        }
      }

      throw new Error('Failed to create topic with unique slug after 5 attempts');
    }

    throw new Error(`Unsupported POST endpoint: ${endpoint}`);
  },

  put: async <T = any>(endpoint: string, body: any): Promise<T> => {
    console.log('Admin API PUT:', endpoint, body);

    if (endpoint.startsWith('/poets/')) {
      const id = endpoint.split('/')[2];
      const updateData: any = {
        name: body.name,
        slug: body.slug,
        short_bio: body.short_bio,
        long_bio: body.long_bio,
        primary_language: body.primary_language,
        avatar_url: body.avatar_url,
        country: body.country,
        birth_year: body.birth_year,
        death_year: body.death_year
      };

      if (body.seo_title !== undefined) updateData.seo_title = body.seo_title?.trim() || null;
      if (body.seo_description !== undefined) updateData.seo_description = body.seo_description?.trim() || null;
      if (body.seo_keywords !== undefined) updateData.seo_keywords = body.seo_keywords?.trim() || null;

      const { data, error } = await supabase
        .from('poets')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as T;
    } else if (endpoint.startsWith('/shayari/')) {
      const id = endpoint.split('/')[2];

      // Update shayari
      const updateData: any = {
        poet_id: body.poet_id,
        form: body.form,
        is_trending: body.is_trending,
        is_featured: body.is_featured,
        popularity_score: body.popularity_score,
        featured_image_url: body.featured_image_url,
        featured_image_alt: body.featured_image_alt
      };

      if (body.slug !== undefined) {
        updateData.slug = body.slug || null;
      }
      if (body.seo_title !== undefined) updateData.seo_title = body.seo_title?.trim() || null;
      if (body.seo_description !== undefined) updateData.seo_description = body.seo_description?.trim() || null;
      if (body.seo_keywords !== undefined) updateData.seo_keywords = body.seo_keywords?.trim() || null;

      const { data: shayari, error: shayariError } = await supabase
        .from('shayari')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (shayariError) throw new Error(shayariError.message);

      // Delete existing language versions
      await supabase
        .from('shayari_language_versions')
        .delete()
        .eq('shayari_id', id);

      // Insert new language versions
      const languageVersions = Object.entries(body.languages)
        .filter(([_, text]) => text && (text as string).trim())
        .map(([language, text]) => ({
          shayari_id: id,
          language,
          text
        }));

      if (languageVersions.length > 0) {
        const { error: versionsError } = await supabase
          .from('shayari_language_versions')
          .insert(languageVersions);

        if (versionsError) throw new Error(versionsError.message);
      }

      // Handle topics - atomic replace
      let topicsInserted = 0;
      if (body.topics !== undefined) {
        // Delete existing
        const { error: deleteTopicsError } = await supabase
          .from('shayari_topics')
          .delete()
          .eq('shayari_id', id);
        if (deleteTopicsError) throw new Error(deleteTopicsError.message || 'Failed to delete existing topics');

        // Insert new
        if (Array.isArray(body.topics) && body.topics.length > 0) {
          const topicLinks = body.topics.map((topicId: string) => ({
            shayari_id: id,
            topic_id: topicId
          }));
          console.log('Updating topic links for', id, ':', topicLinks);
          const { error: insertTopicsError } = await supabase
            .from('shayari_topics')
            .insert(topicLinks);
          if (insertTopicsError) throw new Error(insertTopicsError.message || 'Failed to insert topics');
          topicsInserted = topicLinks.length;
        }
      }

      // Handle tags - atomic replace
      let tagsInserted = 0;
      if (body.tags !== undefined) {
        // Delete existing
        const { error: deleteTagsError } = await supabase
          .from('shayari_tags')
          .delete()
          .eq('shayari_id', id);
        if (deleteTagsError) throw new Error(deleteTagsError.message || 'Failed to delete existing tags');

        // Insert new
        if (Array.isArray(body.tags) && body.tags.length > 0) {
          const tagLinks = body.tags.map((tagId: string) => ({
            shayari_id: id,
            tag_id: tagId
          }));
          console.log('Updating tag links for', id, ':', tagLinks);
          const { error: insertTagsError } = await supabase
            .from('shayari_tags')
            .insert(tagLinks);
          if (insertTagsError) throw new Error(insertTagsError.message || 'Failed to insert tags');
          tagsInserted = tagLinks.length;
        }
      }

      console.log('Shayari updated:', id, 'topics:', topicsInserted, 'tags:', tagsInserted);
      return { ...shayari, _debug: { topicsInserted, tagsInserted } } as T;
    } else if (endpoint.startsWith('/ebooks/')) {
      const id = endpoint.split('/')[2];

      // Build update object with only provided fields
      const updateData: any = {};
      if (body.slug !== undefined) updateData.slug = body.slug || null;
      if (body.poet_id !== undefined) updateData.poet_id = body.poet_id || null;
      if (body.poet_name !== undefined) updateData.poet_name = body.poet_name || null;
      if (body.titles !== undefined) updateData.titles = body.titles;
      if (body.descriptions !== undefined) updateData.descriptions = body.descriptions;
      if (body.cover_image !== undefined) updateData.cover_image = body.cover_image || null;
      if (body.pages !== undefined) updateData.pages = body.pages;
      if (body.file_url_pdf !== undefined) updateData.file_url_pdf = body.file_url_pdf || null;
      if (body.file_url_epub !== undefined) updateData.file_url_epub = body.file_url_epub || null;
      if (body.seo_title !== undefined) updateData.seo_title = body.seo_title?.trim() || null;
      if (body.seo_description !== undefined) updateData.seo_description = body.seo_description?.trim() || null;
      if (body.seo_keywords !== undefined) updateData.seo_keywords = body.seo_keywords?.trim() || null;

      const { data, error } = await supabase
        .from('ebooks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        // Check if it's a unique constraint violation on slug
        if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
          throw new Error('Slug already exists. Please use a different slug.');
        }
        throw new Error(error.message || 'Failed to update ebook');
      }
      console.log('Ebook updated successfully:', data);
      return data as T;
    } else if (endpoint.startsWith('/dictionary/')) {
      const id = endpoint.split('/')[2];
      const updateData: any = {
        word_key: body.word_key,
        word_urdu: body.word_urdu,
        word_roman: body.word_roman,
        word_hindi: body.word_hindi,
        word_english: body.word_english,
        meanings_english: body.meanings_english,
        meanings_urdu: body.meanings_urdu,
        part_of_speech: body.part_of_speech,
        pronunciation: body.pronunciation,
        notes: body.notes
      };

      if (body.seo_title !== undefined) updateData.seo_title = body.seo_title?.trim() || null;
      if (body.seo_description !== undefined) updateData.seo_description = body.seo_description?.trim() || null;
      if (body.seo_keywords !== undefined) updateData.seo_keywords = body.seo_keywords?.trim() || null;

      const { data, error } = await supabase
        .from('dictionary_entries')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message || 'Failed to update dictionary entry');
      console.log('Dictionary entry updated successfully:', data);
      return data as T;
    } else if (endpoint.startsWith('/collections/')) {
      const id = endpoint.split('/')[2];

      const updateData: any = {};
      if (body.title !== undefined) updateData.title = body.title;
      if (body.slug !== undefined) updateData.slug = body.slug;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.cover_image !== undefined) updateData.cover_image = body.cover_image;
      if (body.is_featured !== undefined) updateData.is_featured = body.is_featured;
      if (body.seo_title !== undefined) updateData.seo_title = body.seo_title?.trim() || null;
      if (body.seo_description !== undefined) updateData.seo_description = body.seo_description?.trim() || null;
      if (body.seo_keywords !== undefined) updateData.seo_keywords = body.seo_keywords?.trim() || null;

      const { data, error } = await supabase
        .from('collections')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message || 'Failed to update collection');
      console.log('Collection updated successfully:', data);
      return data as T;
    } else if (endpoint.startsWith('/ad-slots/')) {
      const id = endpoint.split('/')[2];

      const updateData: any = {};
      if (body.key !== undefined) updateData.key = body.key;
      if (body.title !== undefined) updateData.title = body.title;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.placement !== undefined) updateData.placement = body.placement;
      if (body.page_scope !== undefined) updateData.page_scope = body.page_scope;
      if (body.is_active !== undefined) updateData.is_active = body.is_active;
      if (body.priority !== undefined) updateData.priority = body.priority;
      if (body.frequency !== undefined) updateData.frequency = body.frequency;
      if (body.html_snippet !== undefined) updateData.html_snippet = body.html_snippet;

      const { data, error } = await supabase
        .from('ad_slots')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
          throw new Error('Ad slot key already exists. Please use a different key.');
        }
        throw new Error(error.message || 'Failed to update ad slot');
      }
      console.log('Ad slot updated successfully:', data);
      return data as T;
    } else if (endpoint.startsWith('/tags/')) {
      const id = endpoint.split('/')[2];

      const updateData: any = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.slug !== undefined) updateData.slug = body.slug;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.seo_title !== undefined) updateData.seo_title = body.seo_title?.trim() || null;
      if (body.seo_description !== undefined) updateData.seo_description = body.seo_description?.trim() || null;
      if (body.seo_keywords !== undefined) updateData.seo_keywords = body.seo_keywords?.trim() || null;

      const { data, error } = await supabase
        .from('tags')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as T;
    } else if (endpoint.startsWith('/topics/')) {
      const id = endpoint.split('/')[2];

      const updateData: any = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.slug !== undefined) updateData.slug = body.slug;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.seo_title !== undefined) updateData.seo_title = body.seo_title?.trim() || null;
      if (body.seo_description !== undefined) updateData.seo_description = body.seo_description?.trim() || null;
      if (body.seo_keywords !== undefined) updateData.seo_keywords = body.seo_keywords?.trim() || null;

      const { data, error } = await supabase
        .from('topics')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as T;
    }

    throw new Error(`Unsupported PUT endpoint: ${endpoint}`);
  },

  delete: async <T = any>(endpoint: string): Promise<T> => {
    console.log('Admin API DELETE:', endpoint);

    if (endpoint.startsWith('/poets/')) {
      const id = endpoint.split('/')[2];
      const { error } = await supabase
        .from('poets')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
      return {} as T;
    } else if (endpoint.startsWith('/shayari/')) {
      const id = endpoint.split('/')[2];

      // Delete language versions first
      await supabase
        .from('shayari_language_versions')
        .delete()
        .eq('shayari_id', id);

      // Delete shayari
      const { error } = await supabase
        .from('shayari')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
      return {} as T;
    } else if (endpoint.startsWith('/ebooks/')) {
      const id = endpoint.split('/')[2];
      const { error } = await supabase
        .from('ebooks')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message || 'Failed to delete ebook');
      console.log('Ebook deleted successfully');
      return {} as T;
    } else if (endpoint.startsWith('/dictionary/')) {
      const id = endpoint.split('/')[2];
      const { error } = await supabase
        .from('dictionary_entries')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message || 'Failed to delete dictionary entry');
      console.log('Dictionary entry deleted successfully');
      return {} as T;
    } else if (endpoint.startsWith('/collections/')) {
      const id = endpoint.split('/')[2];

      // Delete collection items first (cascade should handle this, but being explicit)
      await supabase
        .from('collection_items')
        .delete()
        .eq('collection_id', id);

      // Delete collection
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message || 'Failed to delete collection');
      console.log('Collection deleted successfully');
      return {} as T;
    } else if (endpoint.startsWith('/ad-slots/')) {
      const id = endpoint.split('/')[2];
      const { error } = await supabase
        .from('ad_slots')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message || 'Failed to delete ad slot');
      console.log('Ad slot deleted successfully');
      return {} as T;
    } else if (endpoint.startsWith('/tags/')) {
      const id = endpoint.split('/')[2];

      // Delete shayari_tags relationships first (cascade should handle this, but being explicit)
      await supabase
        .from('shayari_tags')
        .delete()
        .eq('tag_id', id);

      // Delete tag
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message || 'Failed to delete tag');
      console.log('Tag deleted successfully');
      return {} as T;
    } else if (endpoint.startsWith('/topics/')) {
      const id = endpoint.split('/')[2];

      // Delete shayari_topics relationships first (cascade should handle this, but being explicit)
      await supabase
        .from('shayari_topics')
        .delete()
        .eq('topic_id', id);

      // Delete topic
      const { error } = await supabase
        .from('topics')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message || 'Failed to delete topic');
      console.log('Topic deleted successfully');
      return {} as T;
    }

    throw new Error(`Unsupported DELETE endpoint: ${endpoint}`);
  },

  getCollectionItems: async (collectionId: string, options?: { page?: number; pageSize?: number }) => {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 50;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('collection_items')
      .select(`
        id,
        sort_order,
        shayari:shayari_id (
          id,
          form,
          is_trending,
          is_featured,
          poets (name),
          shayari_language_versions (language, text)
        )
      `, { count: 'exact' })
      .eq('collection_id', collectionId)
      .order('sort_order')
      .range(from, to);

    if (error) throw new Error(error.message || 'Failed to fetch collection items');
    return { data: data || [], total: count || 0 };
  },

  addCollectionItem: async (collectionId: string, shayariId: string, sortOrder?: number) => {
    if (sortOrder === undefined) {
      const { data: maxSort } = await supabase
        .from('collection_items')
        .select('sort_order')
        .eq('collection_id', collectionId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle();

      sortOrder = (maxSort?.sort_order || 0) + 1;
    }

    const { data, error } = await supabase
      .from('collection_items')
      .insert({
        collection_id: collectionId,
        shayari_id: shayariId,
        sort_order: sortOrder
      })
      .select()
      .single();

    if (error) throw new Error(error.message || 'Failed to add item to collection');
    return data;
  },

  removeCollectionItem: async (itemId: string) => {
    const { error } = await supabase
      .from('collection_items')
      .delete()
      .eq('id', itemId);

    if (error) throw new Error(error.message || 'Failed to remove item from collection');
  },

  reorderCollectionItems: async (collectionId: string, itemIds: string[]) => {
    const updates = itemIds.map((id, index) => ({
      id,
      sort_order: index
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from('collection_items')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id)
        .eq('collection_id', collectionId);

      if (error) throw new Error(error.message || 'Failed to reorder collection items');
    }
  },

  bulkAddCollectionItems: async (collectionId: string, shayariIds: string[]) => {
    const { data: maxSort } = await supabase
      .from('collection_items')
      .select('sort_order')
      .eq('collection_id', collectionId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    let startOrder = (maxSort?.sort_order || 0) + 1;

    const chunkSize = 100;
    let allInserted = 0;
    let skipped = 0;

    for (let i = 0; i < shayariIds.length; i += chunkSize) {
      const chunk = shayariIds.slice(i, i + chunkSize);
      const items = chunk.map((shayariId, index) => ({
        collection_id: collectionId,
        shayari_id: shayariId,
        sort_order: startOrder + i + index
      }));

      const { data, error } = await supabase
        .from('collection_items')
        .insert(items)
        .select();

      if (error) {
        if (error.code === '23505') {
          skipped += chunk.length;
          continue;
        }
        throw new Error(error.message || 'Failed to add items to collection');
      }

      allInserted += data?.length || 0;
    }

    return { inserted: allInserted, skipped };
  },

  bulkRemoveCollectionItems: async (itemIds: string[]) => {
    const { error } = await supabase
      .from('collection_items')
      .delete()
      .in('id', itemIds);

    if (error) throw new Error(error.message || 'Failed to remove items from collection');
  },

  searchShayari: async (options: {
    query?: string;
    form?: string;
    poetId?: string;
    language?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const { query, form, poetId, language, page = 1, pageSize = 20 } = options;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let queryBuilder = supabase
      .from('shayari')
      .select(`
        id,
        form,
        is_trending,
        is_featured,
        poets (id, name),
        shayari_language_versions (language, text)
      `, { count: 'exact' });

    if (form && form !== 'all') {
      queryBuilder = queryBuilder.eq('form', form);
    }

    if (poetId && poetId !== 'all') {
      queryBuilder = queryBuilder.eq('poet_id', poetId);
    }

    if (query && query.trim()) {
      queryBuilder = queryBuilder.or(
        `shayari_language_versions.text.ilike.%${query.trim()}%`
      );
    }

    const { data, error, count } = await queryBuilder
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message || 'Failed to search shayari');

    let results = data || [];

    if (language && language !== 'all') {
      results = results.filter(s =>
        s.shayari_language_versions?.some((v: any) => v.language === language)
      );
    }

    if (query && query.trim()) {
      const searchTerm = query.trim().toLowerCase();
      results = results.filter(s => {
        const hasMatchingText = s.shayari_language_versions?.some((v: any) =>
          v.text?.toLowerCase().includes(searchTerm)
        );
        const hasMatchingPoet = s.poets?.name?.toLowerCase().includes(searchTerm);
        return hasMatchingText || hasMatchingPoet;
      });
    }

    return { data: results, total: count || 0 };
  },
};
