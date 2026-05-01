
interface WordPressPost {
  id: number;
  slug: string;
  link: string;
  title?: { rendered?: string } | string;
  content?: { rendered?: string } | string;
  categories: number[];
  tags: number[];
  featured_media?: number;
  yoast_head_json?: {
    title?: string;
    description?: string;
    canonical?: string;
  };
}

interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  yoast_head_json?: {
    title?: string;
    description?: string;
  };
}

interface WordPressTag {
  id: number;
  name: string;
  slug: string;
  description: string;
  yoast_head_json?: {
    title?: string;
    description?: string;
  };
}

interface WordPressMedia {
  id: number;
  source_url: string;
  alt_text?: string;
}

interface ImportProgress {
  totalFetched: number;
  imported: number;
  skipped: number;
  errors: string[];
  currentPage: number;
  lastPostId: number;
  authExpired?: boolean;
}

interface ImportState {
  mode: 'categories' | 'tags' | 'posts';
  lastPage: number;
  lastPostId: number;
  imported: number;
  skipped: number;
}

export class WordPressImporter {
  private baseUrl: string;
  private progress: ImportProgress = {
    totalFetched: 0,
    imported: 0,
    skipped: 0,
    errors: [],
    currentPage: 0,
    lastPostId: 0
  };

constructor(baseUrl: string) {
  if (baseUrl) {
    const url = new URL(baseUrl.replace(/\/$/, ''));
    this.baseUrl = url.origin;
  } else {
    this.baseUrl = '';
  }
}

  private async ensureAuth(): Promise<boolean> {
    const token = localStorage.getItem('adminAccessToken');
    if (!token) {
      this.progress.authExpired = true;
      return false;
    }
    return true;
  }

  private async retryWithAuth<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
      return await fn();
    } catch (error: any) {
      if (error?.message?.includes('JWT expired') || error?.status === 401) {
        const authOk = await this.ensureAuth();
        if (!authOk) {
          throw new Error('AUTH_EXPIRED');
        }
        return await fn();
      }
      throw error;
    }
  }

  private saveState(state: ImportState): void {
    localStorage.setItem('wp_import_state', JSON.stringify(state));
  }

  private loadState(): ImportState | null {
    const saved = localStorage.getItem('wp_import_state');
    return saved ? JSON.parse(saved) : null;
  }

  private clearState(): void {
    localStorage.removeItem('wp_import_state');
  }

  private cleanSeoTitle(title: string): string {
    return title.replace(/\s*[-|]\s*Urdu Poetry\s*$/i, '').trim();
  }

  private async fetchWithRetry(url: string, retries = 3): Promise<Response> {
    const delays = [2000, 5000, 10000];

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (response.ok) return response;

        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delays[attempt]));
        }
      } catch (error) {
        if (attempt === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delays[attempt]));
      }
    }

    throw new Error('Max retries reached');
  }

  private stripHtml(html: string): string {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  private extractFirstImageUrl(html: string): string | null {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const img = tmp.querySelector('img');
    return img?.src || null;
  }

  private extractTitle(post: WordPressPost): string {
    if (typeof post.title === 'string') return post.title;
    return post.title?.rendered || '';
  }

  private extractContent(post: WordPressPost): string {
    if (typeof post.content === 'string') return post.content;
    return post.content?.rendered || '';
  }

  private extractLanguageVersions(content: string): { roman: string; urdu: string; hindi: string } {
    const lines = content.split('\n').map(l => l.trim()).filter(l => l);

    if (lines.length === 0) {
      return { roman: '', urdu: '', hindi: '' };
    }

    if (lines.length > 6) {
      return { roman: lines.join('\n'), urdu: '', hindi: '' };
    }

    const roman = lines.slice(0, 2).join('\n');
    const urdu = lines.slice(2, 4).join('\n');
    const hindi = lines.slice(4, 6).join('\n');

    return { roman, urdu, hindi };
  }

  async fetchMedia(mediaId: number): Promise<WordPressMedia | null> {
    try {
      const url = `${this.baseUrl}/wp-json/wp/v2/media/${mediaId}`;
      const response = await this.fetchWithRetry(url);
      return await response.json();
    } catch {
      return null;
    }
  }

  async fetchCategories(): Promise<Map<number, string>> {
    const categoryMap = new Map<number, string>();
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      if (!await this.ensureAuth()) {
        throw new Error('AUTH_EXPIRED');
      }

      try {
        const url = `${this.baseUrl}/wp-json/wp/v2/categories?per_page=100&page=${page}&_fields=id,name,slug,description,yoast_head_json`;
        const response = await this.fetchWithRetry(url);
        const categories: WordPressCategory[] = await response.json();

        if (categories.length === 0) break;

        for (const cat of categories) {
          const seoTitle = this.cleanSeoTitle(cat.yoast_head_json?.title || cat.name);
          const seoDescription = cat.yoast_head_json?.description || cat.description || `Browse shayari about ${cat.name}`;

          const result = await this.retryWithAuth(async () => {
            const { data } = await supabase
              .from('topics')
              .select('id')
              .eq('slug', cat.slug)
              .maybeSingle();

            if (!data) {
              const { data: newTopic } = await supabase
                .from('topics')
                .insert({
                  name: cat.name,
                  slug: cat.slug,
                  description: cat.description || seoDescription,
                  icon: 'BookOpen',
                  seo_title: seoTitle,
                  seo_description: seoDescription,
                  seo_keywords: null
                })
                .select('id')
                .single();

              return newTopic;
            } else {
              await supabase
                .from('topics')
                .update({
                  seo_title: seoTitle,
                  seo_description: seoDescription
                })
                .eq('id', data.id);

              return data;
            }
          });

          if (result) {
            categoryMap.set(cat.id, result.id);
          }
        }

        page++;
        hasMore = categories.length === 100;
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error: any) {
        if (error?.message === 'AUTH_EXPIRED') throw error;
        this.progress.errors.push(`Category fetch failed: ${error}`);
        throw error;
      }
    }

    return categoryMap;
  }

  async fetchTags(): Promise<Map<number, string>> {
    const tagMap = new Map<number, string>();
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      if (!await this.ensureAuth()) {
        throw new Error('AUTH_EXPIRED');
      }

      try {
        const url = `${this.baseUrl}/wp-json/wp/v2/tags?per_page=100&page=${page}&_fields=id,name,slug,description,yoast_head_json`;
        const response = await this.fetchWithRetry(url);
        const tags: WordPressTag[] = await response.json();

        if (tags.length === 0) break;

        for (const tag of tags) {
          const seoTitle = this.cleanSeoTitle(tag.yoast_head_json?.title || tag.name);
          const seoDescription = tag.yoast_head_json?.description || tag.description || null;

          const result = await this.retryWithAuth(async () => {
            const { data } = await supabase
              .from('tags')
              .select('id')
              .eq('slug', tag.slug)
              .maybeSingle();

            if (!data) {
              const { data: newTag } = await supabase
                .from('tags')
                .insert({
                  name: tag.name,
                  slug: tag.slug,
                  description: tag.description || null,
                  seo_title: seoTitle,
                  seo_description: seoDescription,
                  seo_keywords: null
                })
                .select('id')
                .single();

              return newTag;
            } else {
              await supabase
                .from('tags')
                .update({
                  seo_title: seoTitle,
                  seo_description: seoDescription
                })
                .eq('id', data.id);

              return data;
            }
          });

          if (result) {
            tagMap.set(tag.id, result.id);
          }
        }

        page++;
        hasMore = tags.length === 100;
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error: any) {
        if (error?.message === 'AUTH_EXPIRED') throw error;
        this.progress.errors.push(`Tag fetch failed: ${error}`);
        throw error;
      }
    }

    return tagMap;
  }

  async importPosts(
    categoryMap: Map<number, string>,
    tagMap: Map<number, string>,
    onProgress?: (progress: ImportProgress) => void
  ): Promise<ImportProgress> {
    const savedState = this.loadState();
    let page = savedState?.mode === 'posts' ? savedState.lastPage : 1;
    let hasMore = true;

    while (hasMore) {
      if (!await this.ensureAuth()) {
        this.progress.authExpired = true;
        throw new Error('AUTH_EXPIRED');
      }

      this.progress.currentPage = page;

      try {
        const url = `${this.baseUrl}/wp-json/wp/v2/posts?per_page=50&page=${page}&_fields=id,slug,title,content,categories,tags,featured_media,link,yoast_head_json`;
        const response = await this.fetchWithRetry(url);
        const posts: WordPressPost[] = await response.json();

        if (posts.length === 0) break;

        this.progress.totalFetched += posts.length;

        const batch = [];
        for (const post of posts) {
          batch.push(post);

          if (batch.length >= 15) {
            await this.processBatch(batch, categoryMap, tagMap);
            batch.length = 0;
            await new Promise(resolve => setTimeout(resolve, 150));
          }
        }

        if (batch.length > 0) {
          await this.processBatch(batch, categoryMap, tagMap);
        }

        this.saveState({
          mode: 'posts',
          lastPage: page,
          lastPostId: posts[posts.length - 1]?.id || 0,
          imported: this.progress.imported,
          skipped: this.progress.skipped
        });

        if (onProgress) {
          onProgress({ ...this.progress });
        }

        page++;
        hasMore = posts.length === 50;
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error: any) {
        if (error?.message === 'AUTH_EXPIRED') {
          this.progress.authExpired = true;
          throw error;
        }
        this.progress.errors.push(`Post fetch failed: ${error}`);
        throw error;
      }
    }

    this.clearState();
    return this.progress;
  }

  private async processBatch(
    posts: WordPressPost[],
    categoryMap: Map<number, string>,
    tagMap: Map<number, string>
  ): Promise<void> {
    for (const post of posts) {
      if (!await this.ensureAuth()) {
        throw new Error('AUTH_EXPIRED');
      }

      try {
        const title = this.extractTitle(post);
        const contentRaw = this.extractContent(post);

        if (!title && !contentRaw) {
          this.progress.skipped++;
          continue;
        }

        const exists = await this.retryWithAuth(async () => {
          const { data: existingByWpId } = await supabase
            .from('shayari')
            .select('id')
            .eq('wordpress_post_id', post.id)
            .maybeSingle();

          if (existingByWpId) return true;

          const { data: existingBySlug } = await supabase
            .from('shayari')
            .select('id')
            .eq('slug', post.slug)
            .maybeSingle();

          return !!existingBySlug;
        });

        if (exists) {
          this.progress.skipped++;
          continue;
        }

        const content = this.stripHtml(contentRaw);
        const languages = this.extractLanguageVersions(content);

        if (!languages.roman && !languages.urdu && !languages.hindi) {
          this.progress.skipped++;
          continue;
        }

        const seoDescription = content.slice(0, 160);
        const seoTitle = this.cleanSeoTitle(post.yoast_head_json?.title || title);
        const seoDesc = post.yoast_head_json?.description || seoDescription;
        const canonicalUrl = post.yoast_head_json?.canonical || null;

        let featuredImageUrl = null;
        let featuredImageAlt = null;
        let wpFeaturedMediaId = null;

        if (post.featured_media) {
          const media = await this.fetchMedia(post.featured_media);
          if (media) {
            featuredImageUrl = media.source_url;
            featuredImageAlt = media.alt_text || title;
            wpFeaturedMediaId = media.id;
          }
        }

        if (!featuredImageUrl) {
          featuredImageUrl = this.extractFirstImageUrl(contentRaw);
        }

        const shayariResult = await this.retryWithAuth(async () => {
          const { data: shayari, error: shayariError } = await supabase
            .from('shayari')
            .insert({
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
              is_trending: false,
              popularity_score: 0,
              source: 'wordpress',
              seo_title: seoTitle,
              seo_description: seoDesc,
              seo_keywords: null
            })
            .select('id')
            .single();

          if (shayariError) throw shayariError;
          return shayari;
        });

        if (!shayariResult) {
          if (this.progress.errors.length < 50) {
            this.progress.errors.push(`Post ${post.id}: Failed to insert`);
          }
          continue;
        }

        const languageInserts = [];

        if (languages.roman) {
          languageInserts.push({
            shayari_id: shayariResult.id,
            language: 'roman_urdu',
            text: languages.roman
          });
        }

        if (languages.urdu) {
          languageInserts.push({
            shayari_id: shayariResult.id,
            language: 'urdu',
            text: languages.urdu
          });
        }

        if (languages.hindi) {
          languageInserts.push({
            shayari_id: shayariResult.id,
            language: 'hindi',
            text: languages.hindi
          });
        }

        if (languageInserts.length > 0) {
          await this.retryWithAuth(async () => {
            const { error: langError } = await supabase
              .from('shayari_language_versions')
              .insert(languageInserts);

            if (langError) throw langError;
          });
        }

        for (const catId of post.categories) {
          const topicId = categoryMap.get(catId);
          if (topicId) {
            await this.retryWithAuth(async () => {
              await supabase
                .from('shayari_topics')
                .insert({
                  shayari_id: shayariResult.id,
                  topic_id: topicId
                })
                .then(() => {});
            });
          }
        }

        for (const tagId of post.tags) {
          const tagUuid = tagMap.get(tagId);
          if (tagUuid) {
            await this.retryWithAuth(async () => {
              await supabase
                .from('shayari_tags')
                .insert({
                  shayari_id: shayariResult.id,
                  tag_id: tagUuid
                })
                .then(() => {});
            });
          }
        }

        this.progress.imported++;
        this.progress.lastPostId = post.id;
      } catch (error: any) {
        if (error?.message === 'AUTH_EXPIRED') throw error;
        if (this.progress.errors.length < 50) {
          this.progress.errors.push(`Post ${post.id}: ${error?.message || error}`);
        }
      }
    }
  }

  async import(onProgress?: (progress: ImportProgress) => void): Promise<ImportProgress> {
    try {
      const categoryMap = await this.fetchCategories();
      const tagMap = await this.fetchTags();
      return await this.importPosts(categoryMap, tagMap, onProgress);
    } catch (error: any) {
      if (error?.message === 'AUTH_EXPIRED') {
        this.progress.authExpired = true;
      }
      throw error;
    }
  }

  async resume(onProgress?: (progress: ImportProgress) => void): Promise<ImportProgress> {
    const savedState = this.loadState();
    if (!savedState) {
      throw new Error('No saved state found');
    }

    this.progress.imported = savedState.imported;
    this.progress.skipped = savedState.skipped;

    return await this.import(onProgress);
  }

  hasResumableState(): boolean {
    return !!this.loadState();
  }

  getProgress(): ImportProgress {
    return { ...this.progress };
  }
}
