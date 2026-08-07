const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3001';

function getAuthToken(): string | null {
  return localStorage.getItem('adminAccessToken');
}

async function adminFetch<T = any>(path: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers
    }
  });

  if (response.status === 401) {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');

    if (window.location.pathname !== '/admin-login') {
      window.location.replace('/admin-login');
    }

    throw new Error('Your admin session has expired. Please log in again.');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(err.error || err.message || `HTTP ${response.status}`);
  }
  return response.json();
}

export const adminApi = {
  get: async <T = any>(endpoint: string): Promise<T> => {
    if (endpoint === '/ai-image-settings') {
      return adminFetch<T>('/api/ai-image-settings');
    }
    // Map admin endpoints to backend API paths
    if (endpoint.startsWith('/poets')) {
      const parts = endpoint.split('/').filter(Boolean);
      if (parts.length === 2) return adminFetch<T>(`/api/poets/by-id/${parts[1]}`);
      const result = await adminFetch<any>('/api/poets?pageSize=200');
      return (result.data ?? result) as T;
    }
    if (endpoint.startsWith('/shayari')) {
      const parts = endpoint.split('/').filter(Boolean);
      if (parts.length === 2) {
        const data = await adminFetch<any>(`/api/shayari/${parts[1]}`);
        const topic_ids = (data.topics || []).map((t: any) => t.id).filter(Boolean);
        const tag_ids = (data.tags || []).map((t: any) => t.id).filter(Boolean);
        return { ...data, topic_ids, tag_ids } as T;
      }
      const result = await adminFetch<any>('/api/shayari?pageSize=200');
      return (result.data ?? result) as T;
    }
    if (endpoint.startsWith('/ebooks')) {
      const parts = endpoint.split('/').filter(Boolean);
      if (parts.length === 2) return adminFetch<T>(`/api/ebooks/by-id/${parts[1]}`);
      const result = await adminFetch<any>('/api/ebooks?pageSize=200');
      return (result.data ?? result) as T;
    }
    if (endpoint.startsWith('/dictionary')) {
      const parts = endpoint.split('/').filter(Boolean);
      if (parts.length === 2) return adminFetch<T>(`/api/dictionary/by-id/${parts[1]}`);
      const result = await adminFetch<any>('/api/dictionary?pageSize=200');
      return (result.data ?? result) as T;
    }
    if (endpoint.startsWith('/collections')) {
      const parts = endpoint.split('/').filter(Boolean);
      if (parts.length === 2) return adminFetch<T>(`/api/collections/by-id/${parts[1]}`);
      const result = await adminFetch<any>('/api/collections?pageSize=200');
      return (result.data ?? result) as T;
    }
    if (endpoint.startsWith('/ad-slots')) {
      const parts = endpoint.split('/').filter(Boolean);
      if (parts.length === 2) return adminFetch<T>(`/api/ad-slots/by-id/${parts[1]}`);
      const result = await adminFetch<any>('/api/ad-slots');
      return (result.data ?? result) as T;
    }
    if (endpoint.startsWith('/tags')) {
      if (endpoint === '/tags/all') {
        const result = await adminFetch<any>('/api/tags/all');
        return (result.data ?? result) as T;
      }
      const parts = endpoint.split('/').filter(Boolean);
      if (parts.length === 2) return adminFetch<T>(`/api/tags/by-id/${parts[1]}`);
      const result = await adminFetch<any>('/api/tags?page=1&pageSize=100');
      return (result.data ?? result) as T;
    }
    if (endpoint.startsWith('/topics')) {
      const parts = endpoint.split('/').filter(Boolean);
      if (parts.length === 2) return adminFetch<T>(`/api/topics/by-id/${parts[1]}`);
      const result = await adminFetch<any>('/api/topics');
      return (result.data ?? result) as T;
    }
    throw new Error(`Unsupported GET endpoint: ${endpoint}`);
  },

  post: async <T = any>(endpoint: string, body: any): Promise<T> => {
    if (endpoint === '/poets') return adminFetch<T>('/api/poets', { method: 'POST', body: JSON.stringify(body) });
    if (endpoint === '/shayari') return adminFetch<T>('/api/shayari', { method: 'POST', body: JSON.stringify(body) });
    if (endpoint === '/ebooks') return adminFetch<T>('/api/ebooks', { method: 'POST', body: JSON.stringify(body) });
    if (endpoint === '/dictionary') return adminFetch<T>('/api/dictionary', { method: 'POST', body: JSON.stringify(body) });
    if (endpoint === '/collections') return adminFetch<T>('/api/collections', { method: 'POST', body: JSON.stringify(body) });
    if (endpoint === '/ad-slots') return adminFetch<T>('/api/ad-slots', { method: 'POST', body: JSON.stringify(body) });
    if (endpoint === '/tags') return adminFetch<T>('/api/tags', { method: 'POST', body: JSON.stringify(body) });
    if (endpoint === '/topics') return adminFetch<T>('/api/topics', { method: 'POST', body: JSON.stringify(body) });
    throw new Error(`Unsupported POST endpoint: ${endpoint}`);
  },

  put: async <T = any>(endpoint: string, body: any): Promise<T> => {
    if (endpoint === '/ai-image-settings') {
      return adminFetch<T>('/api/ai-image-settings', { method: 'PUT', body: JSON.stringify(body) });
    }
    const parts = endpoint.split('/').filter(Boolean);
    const resource = parts[0];
    const id = parts[1];
    if (!id) throw new Error(`Missing ID in PUT endpoint: ${endpoint}`);

    const paths: Record<string, string> = {
      poets: `/api/poets/${id}`,
      shayari: `/api/shayari/${id}`,
      ebooks: `/api/ebooks/${id}`,
      dictionary: `/api/dictionary/${id}`,
      collections: `/api/collections/${id}`,
      'ad-slots': `/api/ad-slots/${id}`,
      tags: `/api/tags/${id}`,
      topics: `/api/topics/${id}`
    };

    if (!paths[resource]) throw new Error(`Unsupported PUT endpoint: ${endpoint}`);
    return adminFetch<T>(paths[resource], { method: 'PUT', body: JSON.stringify(body) });
  },

  delete: async <T = any>(endpoint: string): Promise<T> => {
    const parts = endpoint.split('/').filter(Boolean);
    const resource = parts[0];
    const id = parts[1];
    if (!id) throw new Error(`Missing ID in DELETE endpoint: ${endpoint}`);

    const paths: Record<string, string> = {
      poets: `/api/poets/${id}`,
      shayari: `/api/shayari/${id}`,
      ebooks: `/api/ebooks/${id}`,
      dictionary: `/api/dictionary/${id}`,
      collections: `/api/collections/${id}`,
      'ad-slots': `/api/ad-slots/${id}`,
      tags: `/api/tags/${id}`,
      topics: `/api/topics/${id}`
    };

    if (!paths[resource]) throw new Error(`Unsupported DELETE endpoint: ${endpoint}`);
    return adminFetch<T>(paths[resource], { method: 'DELETE' });
  },

  getCollectionItems: async (collectionId: string, options?: { page?: number; pageSize?: number }) => {
    const qs = new URLSearchParams();
    if (options?.page) qs.set('page', String(options.page));
    if (options?.pageSize) qs.set('pageSize', String(options.pageSize));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return adminFetch<{ data: any[]; total: number }>(`/api/collections/${collectionId}/items${query}`);
  },

  addCollectionItem: async (collectionId: string, shayariId: string, sortOrder?: number) => {
    return adminFetch<any>(`/api/collections/${collectionId}/items`, {
      method: 'POST',
      body: JSON.stringify({ shayari_id: shayariId, sort_order: sortOrder })
    });
  },

  removeCollectionItem: async (itemId: string) => {
    return adminFetch<any>(`/api/collections/items/${itemId}`, { method: 'DELETE' });
  },

  reorderCollectionItems: async (collectionId: string, itemIds: string[]) => {
    return adminFetch<any>(`/api/collections/${collectionId}/items/reorder`, {
      method: 'POST',
      body: JSON.stringify({ item_ids: itemIds })
    });
  },

  bulkAddCollectionItems: async (collectionId: string, shayariIds: string[]) => {
    return adminFetch<{ inserted: number; skipped: number }>(`/api/collections/${collectionId}/items/bulk`, {
      method: 'POST',
      body: JSON.stringify({ shayari_ids: shayariIds })
    });
  },

  bulkRemoveCollectionItems: async (itemIds: string[]) => {
    return adminFetch<any>('/api/collections/items/bulk', {
      method: 'DELETE',
      body: JSON.stringify({ item_ids: itemIds })
    });
  },

  searchShayari: async (options: { query?: string; form?: string; poetId?: string; language?: string; page?: number; pageSize?: number; batchOffset?: number; fresh?: boolean; searchAll?: boolean }) => {
    const { query, form, poetId, language, page = 1, pageSize = 20, batchOffset, fresh = false, searchAll = false } = options;
    const qs = new URLSearchParams();
    if (searchAll) {
      qs.set('searchAll', 'true');
    } else {
      qs.set('page', String(page));
      qs.set('pageSize', String(pageSize));
    }
    if (query && query.trim()) qs.set('q', query.trim());
    if (form && form !== 'all') qs.set('form', form);
    if (poetId && poetId !== 'all') qs.set('poetId', poetId);
    if (language && language !== 'all') qs.set('language', language);

    const result = await adminFetch<{ data: any[]; pagination: any }>(`/api/shayari?${qs.toString()}`, {
      cache: fresh ? 'no-store' : 'default',
      headers: batchOffset !== undefined ? { 'X-Batch-Offset': String(batchOffset) } : undefined
    });

    return { data: result.data || [], total: result.pagination?.total || 0 };
  }
};
