/*
  # Add Storage RLS Policies for Media Bucket

  1. Purpose
    - Allow authenticated admin users to upload, update, and delete images
    - Allow public read access to all media files
    - Prevent anonymous uploads to maintain security

  2. Policies
    - INSERT: Authenticated users can upload to media bucket
    - UPDATE: Authenticated users can update files in media bucket
    - DELETE: Authenticated users can delete files from media bucket
    - SELECT: Public read access for displaying images on frontend

  3. Security
    - Write operations (INSERT/UPDATE/DELETE) restricted to authenticated users only
    - Read operations (SELECT) open to public for image display
*/

-- Allow authenticated users to upload files to media bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow authenticated uploads to media'
  ) THEN
    CREATE POLICY "Allow authenticated uploads to media"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'media');
  END IF;
END $$;

-- Allow authenticated users to update files in media bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow authenticated updates to media'
  ) THEN
    CREATE POLICY "Allow authenticated updates to media"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'media')
      WITH CHECK (bucket_id = 'media');
  END IF;
END $$;

-- Allow authenticated users to delete files from media bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow authenticated deletes from media'
  ) THEN
    CREATE POLICY "Allow authenticated deletes from media"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'media');
  END IF;
END $$;

-- Allow public read access to media bucket for frontend display
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public read access to media'
  ) THEN
    CREATE POLICY "Public read access to media"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'media');
  END IF;
END $$;
