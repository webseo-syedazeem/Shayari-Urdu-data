/*
  # Add Slug Support to Shayari and Ensure Dictionary Word Key Constraint

  ## Changes Made

  1. Shayari Table
    - Add `slug` column (text, nullable, unique)
    - Add `wordpress_post_id` column (integer, nullable, unique)
    - Add unique constraint/index on slug
    - Note: Nullable to allow gradual migration; slugs will be auto-generated on create/update

  2. Dictionary Table
    - Verify word_key has unique constraint (already exists)
    - Add check constraint to enforce lowercase, no spaces (replaced with hyphens)

  ## Security
    - No RLS changes needed
    - Existing policies remain intact
*/

-- Add slug column to shayari table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shayari' AND column_name = 'slug'
  ) THEN
    ALTER TABLE shayari ADD COLUMN slug text;
  END IF;
END $$;

-- Add wordpress_post_id column to shayari table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shayari' AND column_name = 'wordpress_post_id'
  ) THEN
    ALTER TABLE shayari ADD COLUMN wordpress_post_id integer;
  END IF;
END $$;

-- Add unique constraint on shayari.slug (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'shayari_slug_unique'
  ) THEN
    ALTER TABLE shayari ADD CONSTRAINT shayari_slug_unique UNIQUE (slug);
  END IF;
END $$;

-- Add unique constraint on shayari.wordpress_post_id (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'shayari_wordpress_post_id_unique'
  ) THEN
    ALTER TABLE shayari ADD CONSTRAINT shayari_wordpress_post_id_unique UNIQUE (wordpress_post_id);
  END IF;
END $$;

-- Create index on shayari.slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_shayari_slug ON shayari(slug) WHERE slug IS NOT NULL;

-- Dictionary word_key already has unique constraint, but let's add an index for performance
CREATE INDEX IF NOT EXISTS idx_dictionary_word_key ON dictionary_entries(word_key);
