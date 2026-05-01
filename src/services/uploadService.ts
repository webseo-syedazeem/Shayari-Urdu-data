const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3001';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export type EntityType = 'poets' | 'shayari' | 'ebooks' | 'collections';

export interface UploadResult {
  success: boolean;
  publicUrl?: string;
  path?: string;
  error?: string;
}

export async function uploadImage(file: File, entityType: EntityType, entityId: string): Promise<UploadResult> {
  try {
    const token = localStorage.getItem('adminAccessToken');
    if (!token) {
      return { success: false, error: 'Please login to admin to upload images. Authentication required.' };
    }

    if (!file) return { success: false, error: 'No file provided' };
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { success: false, error: `Invalid file type. Allowed: JPG, PNG, WEBP. Got: ${file.type}` };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024} MB` };
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);

    const res = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || 'Upload failed' };

    return { success: true, publicUrl: data.publicUrl, path: data.path };
  } catch (error) {
    console.error('Unexpected error during upload:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
}

export async function deleteImage(path: string): Promise<boolean> {
  try {
    const token = localStorage.getItem('adminAccessToken');
    if (!token) {
      console.error('Delete failed: Not authenticated');
      return false;
    }

    const res = await fetch(`${BASE_URL}/api/upload`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ path })
    });

    return res.ok;
  } catch (error) {
    console.error('Unexpected error during delete:', error);
    return false;
  }
}
