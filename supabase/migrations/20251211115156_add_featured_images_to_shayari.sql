/*
  # Add Featured Image Support to Shayari

  ## Changes
  - Add featured_image_url column to shayari table
  - Add featured_image_alt column for accessibility
  - Add wordpress_featured_image_id for future WordPress import mapping

  ## Fields Added
  1. featured_image_url (text, nullable)
     - URL of the featured image to display on cards and detail page
  
  2. featured_image_alt (text, nullable)
     - Alt text for the image for accessibility
  
  3. wordpress_featured_image_id (integer, nullable)
     - WordPress attachment ID for import mapping (future use)
*/

-- Add featured image fields to shayari table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shayari' AND column_name = 'featured_image_url'
  ) THEN
    ALTER TABLE shayari ADD COLUMN featured_image_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shayari' AND column_name = 'featured_image_alt'
  ) THEN
    ALTER TABLE shayari ADD COLUMN featured_image_alt text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shayari' AND column_name = 'wordpress_featured_image_id'
  ) THEN
    ALTER TABLE shayari ADD COLUMN wordpress_featured_image_id integer;
  END IF;
END $$;
