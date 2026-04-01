/*
 * UPLOAD SERVICE
 *
 * Handles file uploads to Supabase Storage.
 * Validates file types and sizes before upload.
 * Organizes files in structured folders by entity type.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = 'media';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export type EntityType = 'poets' | 'shayari' | 'ebooks' | 'collections';

export interface UploadResult {
  success: boolean;
  publicUrl?: string;
  path?: string;
  error?: string;
}

async function ensureBucketExists(): Promise<void> {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);

    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: ALLOWED_TYPES
      });

      if (error) {
        console.error('Error creating bucket:', error);
      }
    }
  } catch (error) {
    console.error('Error checking bucket:', error);
  }
}

export async function uploadImage(
  file: File,
  entityType: EntityType,
  entityId: string
): Promise<UploadResult> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return {
        success: false,
        error: 'Please login to admin to upload images. Authentication required.'
      };
    }

    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        success: false,
        error: `Invalid file type. Allowed: JPG, PNG, WEBP. Got: ${file.type}`
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024} MB`
      };
    }

    await ensureBucketExists();

    const timestamp = Date.now();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${entityType === 'poets' ? 'avatar' : entityType === 'shayari' ? 'featured' : 'cover'}-${timestamp}.${ext}`;
    const filePath = `${entityType}/${entityId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: `Upload failed: ${error.message}`
      };
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      success: true,
      publicUrl: urlData.publicUrl,
      path: filePath
    };
  } catch (error) {
    console.error('Unexpected error during upload:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function deleteImage(path: string): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('Delete failed: Not authenticated');
      return false;
    }

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error during delete:', error);
    return false;
  }
}
