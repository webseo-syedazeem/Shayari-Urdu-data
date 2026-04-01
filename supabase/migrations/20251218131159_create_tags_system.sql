/*
  # Create Tags System

  1. New Tables
    - `tags`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `slug` (text, unique, required)
      - `description` (text, nullable)
      - `wordpress_tag_id` (bigint, unique, nullable) - for WordPress import
      - `seo_title` (text, nullable)
      - `seo_description` (text, nullable)
      - `seo_keywords` (text, nullable)
      - `created_at` (timestamptz)

    - `shayari_tags` (join table)
      - `id` (uuid, primary key)
      - `shayari_id` (uuid, FK to shayari)
      - `tag_id` (uuid, FK to tags)
      - `created_at` (timestamptz)
      - Unique constraint on (shayari_id, tag_id)
      - Cascade delete on both FKs

  2. Security
    - Enable RLS on both tables
    - Public SELECT access for tags and shayari_tags
    - Authenticated users can perform full CRUD (admin only in practice)
*/

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  wordpress_tag_id bigint UNIQUE,
  seo_title text,
  seo_description text,
  seo_keywords text,
  created_at timestamptz DEFAULT now()
);

-- Create shayari_tags join table
CREATE TABLE IF NOT EXISTS shayari_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shayari_id uuid NOT NULL REFERENCES shayari(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(shayari_id, tag_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_tags_wordpress_tag_id ON tags(wordpress_tag_id);
CREATE INDEX IF NOT EXISTS idx_shayari_tags_shayari_id ON shayari_tags(shayari_id);
CREATE INDEX IF NOT EXISTS idx_shayari_tags_tag_id ON shayari_tags(tag_id);

-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE shayari_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tags
CREATE POLICY "Anyone can view tags"
  ON tags FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert tags"
  ON tags FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tags"
  ON tags FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete tags"
  ON tags FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for shayari_tags
CREATE POLICY "Anyone can view shayari tags"
  ON shayari_tags FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert shayari tags"
  ON shayari_tags FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update shayari tags"
  ON shayari_tags FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete shayari tags"
  ON shayari_tags FOR DELETE
  TO authenticated
  USING (true);