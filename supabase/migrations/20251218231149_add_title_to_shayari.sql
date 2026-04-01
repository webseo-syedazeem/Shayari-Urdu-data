/*
  # Add Title Column to Shayari

  ## Changes
  
  1. Shayari Table
    - Add `title` column (text, nullable)
    - Add index on title for search performance
  
  ## Purpose
  
  Store the title/heading of each shayari piece, particularly useful for:
  - WordPress imports (preserving post titles)
  - Admin management (easier identification)
  - SEO purposes (meta titles)
  - Display in cards and lists
  
  ## Security
  
  - No RLS changes needed
  - Existing policies remain intact
*/

-- Add title column to shayari table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shayari' AND column_name = 'title'
  ) THEN
    ALTER TABLE shayari ADD COLUMN title text;
  END IF;
END $$;

-- Create index on shayari.title for search performance
CREATE INDEX IF NOT EXISTS idx_shayari_title ON shayari(title) WHERE title IS NOT NULL;
