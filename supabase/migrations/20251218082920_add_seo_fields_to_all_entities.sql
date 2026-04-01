/*
  # Add SEO Fields to All Entity Tables

  ## Changes Made

  1. SEO Columns Added to Tables
    - Add `seo_title` (text, nullable) to: poets, shayari, topics, collections, ebooks, dictionary_entries
    - Add `seo_description` (text, nullable) to all above tables
    - Add `seo_keywords` (text, nullable) to all above tables

  2. Purpose
    - Enable custom SEO metadata for each entity
    - Admin-editable SEO fields for better search engine optimization
    - All fields optional with no breaking changes

  3. No Breaking Changes
    - All columns are nullable
    - Existing data remains intact
    - No constraints that could fail

  ## Usage
  - Admin fills SEO fields via Admin Panel
  - Frontend components use SEO fields with smart fallback logic
  - If SEO fields empty, auto-generate from entity data
*/

-- Add SEO fields to poets table
ALTER TABLE poets
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS seo_keywords text;

-- Add SEO fields to shayari table
ALTER TABLE shayari
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS seo_keywords text;

-- Add SEO fields to topics table
ALTER TABLE topics
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS seo_keywords text;

-- Add SEO fields to collections table
ALTER TABLE collections
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS seo_keywords text;

-- Add SEO fields to ebooks table
ALTER TABLE ebooks
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS seo_keywords text;

-- Add SEO fields to dictionary_entries table
ALTER TABLE dictionary_entries
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS seo_keywords text;

-- Create indexes for SEO fields (useful for admin search/filtering in future)
CREATE INDEX IF NOT EXISTS idx_poets_seo_title ON poets(seo_title) WHERE seo_title IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shayari_seo_title ON shayari(seo_title) WHERE seo_title IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_topics_seo_title ON topics(seo_title) WHERE seo_title IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_collections_seo_title ON collections(seo_title) WHERE seo_title IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ebooks_seo_title ON ebooks(seo_title) WHERE seo_title IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dictionary_entries_seo_title ON dictionary_entries(seo_title) WHERE seo_title IS NOT NULL;
