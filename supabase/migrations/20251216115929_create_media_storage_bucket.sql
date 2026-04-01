/*
  # Create Media Storage Bucket

  1. Storage
    - Create a public 'media' bucket for storing images
    - Organize files by entity type: poets, shayari, ebooks, collections
    
  2. Access Policies
    - Public read access for all media files
    - Authenticated write access for admin uploads
    - File size limit: 5 MB
    - Allowed types: JPG, PNG, WEBP
*/

-- Create the media bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  5242880, -- 5 MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to all files in the media bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public read access for media'
  ) THEN
    CREATE POLICY "Public read access for media"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'media');
  END IF;
END $$;

-- Allow authenticated users to upload files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload media'
  ) THEN
    CREATE POLICY "Authenticated users can upload media"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'media');
  END IF;
END $$;

-- Allow authenticated users to update their uploads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can update media'
  ) THEN
    CREATE POLICY "Authenticated users can update media"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'media')
      WITH CHECK (bucket_id = 'media');
  END IF;
END $$;

-- Allow authenticated users to delete files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can delete media'
  ) THEN
    CREATE POLICY "Authenticated users can delete media"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'media');
  END IF;
END $$;
