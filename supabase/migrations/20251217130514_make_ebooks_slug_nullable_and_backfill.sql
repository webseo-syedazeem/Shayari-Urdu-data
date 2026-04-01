/*
  # Make Ebooks Slug Nullable and Backfill

  ## Changes Made

  1. Ebooks Table Schema
    - Change slug column from NOT NULL to nullable
    - Keep unique constraint on slug
    - Backfill any ebooks with missing or invalid slugs

  2. Backfill Strategy
    - For each ebook with null or empty slug:
      - Generate from titles->>'romanUrdu' (preferred)
      - Fallback to titles->>'english'
      - Fallback to first 8 chars of id if no titles
    - Ensure uniqueness by checking existing slugs

  ## Security
    - No RLS changes needed
    - Existing policies remain intact
*/

-- Make slug nullable
ALTER TABLE ebooks ALTER COLUMN slug DROP NOT NULL;

-- Backfill function to generate slugs for existing ebooks
DO $$
DECLARE
  ebook_record RECORD;
  new_slug TEXT;
  slug_base TEXT;
  slug_counter INTEGER;
  slug_exists BOOLEAN;
BEGIN
  -- Loop through ebooks that might need slug generation
  FOR ebook_record IN 
    SELECT id, slug, titles 
    FROM ebooks 
    WHERE slug IS NULL OR slug = ''
  LOOP
    -- Generate base slug from titles
    slug_base := COALESCE(
      ebook_record.titles->>'romanUrdu',
      ebook_record.titles->>'english',
      ebook_record.titles->>'urdu',
      SUBSTRING(ebook_record.id::text FROM 1 FOR 8)
    );
    
    -- Clean and format the slug
    new_slug := LOWER(TRIM(slug_base));
    new_slug := REGEXP_REPLACE(new_slug, '[^a-z0-9\s-]', '', 'g');
    new_slug := REGEXP_REPLACE(new_slug, '\s+', '-', 'g');
    new_slug := REGEXP_REPLACE(new_slug, '-+', '-', 'g');
    new_slug := TRIM(BOTH '-' FROM new_slug);
    
    -- If slug is empty after cleaning, use id
    IF new_slug = '' OR new_slug IS NULL THEN
      new_slug := SUBSTRING(ebook_record.id::text FROM 1 FOR 8);
    END IF;
    
    -- Check for uniqueness and append counter if needed
    slug_counter := 0;
    LOOP
      IF slug_counter = 0 THEN
        SELECT EXISTS(SELECT 1 FROM ebooks WHERE slug = new_slug AND id != ebook_record.id) INTO slug_exists;
      ELSE
        SELECT EXISTS(SELECT 1 FROM ebooks WHERE slug = new_slug || '-' || slug_counter AND id != ebook_record.id) INTO slug_exists;
      END IF;
      
      EXIT WHEN NOT slug_exists;
      slug_counter := slug_counter + 1;
      
      -- Safety limit
      EXIT WHEN slug_counter > 100;
    END LOOP;
    
    -- Apply the final slug
    IF slug_counter > 0 THEN
      new_slug := new_slug || '-' || slug_counter;
    END IF;
    
    -- Update the ebook with the new slug
    UPDATE ebooks SET slug = new_slug WHERE id = ebook_record.id;
    
    RAISE NOTICE 'Generated slug % for ebook %', new_slug, ebook_record.id;
  END LOOP;
END $$;

-- Add index on slug for better performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_ebooks_slug ON ebooks(slug) WHERE slug IS NOT NULL;
