/*
  # Add WordPress Import Fields to Shayari

  1. New Columns
    - `wordpress_url` (text, nullable) - Full WP URL for reference
    - `canonical_url` (text, nullable) - SEO canonical URL from Yoast
  
  2. Purpose
    - Store original WordPress URL for reference
    - Store canonical URL from Yoast SEO plugin
    - Enable proper SEO and content attribution

  3. Security
    - No RLS changes needed
    - Existing policies remain intact
*/

-- Add wordpress_url column to shayari table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shayari' AND column_name = 'wordpress_url'
  ) THEN
    ALTER TABLE shayari ADD COLUMN wordpress_url text;
  END IF;
END $$;

-- Add canonical_url column to shayari table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shayari' AND column_name = 'canonical_url'
  ) THEN
    ALTER TABLE shayari ADD COLUMN canonical_url text;
  END IF;
END $$;

-- Create indexes for URL lookups
CREATE INDEX IF NOT EXISTS idx_shayari_wordpress_url ON shayari(wordpress_url) WHERE wordpress_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shayari_canonical_url ON shayari(canonical_url) WHERE canonical_url IS NOT NULL;
