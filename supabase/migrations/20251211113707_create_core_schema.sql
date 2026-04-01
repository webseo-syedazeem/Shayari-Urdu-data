/*
  # Create Core Schema for ShayariUrdu.com

  ## Overview
  This migration creates the foundational database schema for a multilingual Urdu poetry platform
  with support for poets, shayari (poetry), topics, collections, ebooks, dictionary, and chat.

  ## New Tables

  ### Poets
  - `id` (uuid, primary key)
  - `name` (text) - Poet's name
  - `slug` (text, unique) - URL-friendly identifier
  - `short_bio` (text) - Brief description
  - `long_bio` (text) - Detailed biography
  - `primary_language` (text) - Default language for poet
  - `avatar_url` (text) - Profile image URL
  - `country` (text) - Country of origin
  - `birth_year` (integer) - Birth year
  - `death_year` (integer) - Death year (nullable)
  - `wordpress_id` (integer) - For WordPress import mapping
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### Topics
  - `id` (uuid, primary key)
  - `name` (text) - Topic name
  - `slug` (text, unique)
  - `description` (text)
  - `icon` (text) - Icon identifier
  - `created_at` (timestamptz)

  ### Shayari
  - `id` (uuid, primary key)
  - `poet_id` (uuid, foreign key)
  - `form` (text) - sher, ghazal, nazm, qitta, quote
  - `is_trending` (boolean)
  - `is_featured` (boolean)
  - `popularity_score` (integer)
  - `wordpress_id` (integer)
  - `source` (text) - wordpress, manual, etc.
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### Shayari Language Versions
  - `id` (uuid, primary key)
  - `shayari_id` (uuid, foreign key)
  - `language` (text) - roman_urdu, urdu, hindi, english
  - `text` (text) - Full text content
  - Unique constraint on (shayari_id, language)

  ### Shayari Topics (junction table)
  - `shayari_id` (uuid, foreign key)
  - `topic_id` (uuid, foreign key)
  - Primary key on (shayari_id, topic_id)

  ### Collections
  - `id` (uuid, primary key)
  - `title` (text)
  - `slug` (text, unique)
  - `description` (text)
  - `cover_image` (text)
  - `is_featured` (boolean)
  - `created_at` (timestamptz)

  ### Collection Items
  - `id` (uuid, primary key)
  - `collection_id` (uuid, foreign key)
  - `shayari_id` (uuid, foreign key)
  - `sort_order` (integer)

  ### Ebooks
  - `id` (uuid, primary key)
  - `slug` (text, unique)
  - `poet_id` (uuid, foreign key, nullable)
  - `poet_name` (text)
  - `titles` (jsonb) - {romanUrdu, urdu, hindi, english}
  - `descriptions` (jsonb) - {romanUrdu, urdu, hindi, english}
  - `cover_image` (text)
  - `pages` (integer)
  - `file_url_pdf` (text)
  - `file_url_epub` (text)
  - `created_at` (timestamptz)

  ### Dictionary Entries
  - `id` (uuid, primary key)
  - `word_key` (text, unique)
  - `word_urdu` (text)
  - `word_roman` (text)
  - `word_hindi` (text)
  - `word_english` (text)
  - `part_of_speech` (text)
  - `pronunciation` (text)
  - `meanings_english` (jsonb array)
  - `meanings_urdu` (jsonb array)
  - `notes` (text)
  - `synonyms` (jsonb array)
  - `created_at` (timestamptz)

  ### Chat Messages
  - `id` (uuid, primary key)
  - `shayari_id` (uuid, foreign key)
  - `user_name` (text)
  - `message_text` (text)
  - `is_pinned` (boolean)
  - `created_at` (timestamptz)

  ### Ad Slots
  - `id` (uuid, primary key)
  - `key` (text, unique) - e.g., home_hero_top
  - `title` (text)
  - `description` (text)
  - `is_active` (boolean)
  - `html_snippet` (text)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Add policies for public read access (appropriate for content site)
  - Chat messages will have write policies for authenticated users later
*/

-- Create enum types
CREATE TYPE language_enum AS ENUM ('roman_urdu', 'urdu', 'hindi', 'english');
CREATE TYPE shayari_form_enum AS ENUM ('sher', 'ghazal', 'nazm', 'qitta', 'quote', 'rubai', 'other');

-- Poets table
CREATE TABLE IF NOT EXISTS poets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  short_bio text,
  long_bio text,
  primary_language language_enum DEFAULT 'urdu',
  avatar_url text,
  country text,
  birth_year integer,
  death_year integer,
  wordpress_id integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Topics table
CREATE TABLE IF NOT EXISTS topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  icon text,
  created_at timestamptz DEFAULT now()
);

-- Shayari table
CREATE TABLE IF NOT EXISTS shayari (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poet_id uuid REFERENCES poets(id) ON DELETE CASCADE,
  form shayari_form_enum NOT NULL DEFAULT 'sher',
  is_trending boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  popularity_score integer DEFAULT 0,
  wordpress_id integer,
  source text DEFAULT 'manual',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Shayari language versions
CREATE TABLE IF NOT EXISTS shayari_language_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shayari_id uuid REFERENCES shayari(id) ON DELETE CASCADE NOT NULL,
  language language_enum NOT NULL,
  text text NOT NULL,
  UNIQUE(shayari_id, language)
);

-- Shayari topics junction table
CREATE TABLE IF NOT EXISTS shayari_topics (
  shayari_id uuid REFERENCES shayari(id) ON DELETE CASCADE,
  topic_id uuid REFERENCES topics(id) ON DELETE CASCADE,
  PRIMARY KEY (shayari_id, topic_id)
);

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  cover_image text,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Collection items
CREATE TABLE IF NOT EXISTS collection_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid REFERENCES collections(id) ON DELETE CASCADE NOT NULL,
  shayari_id uuid REFERENCES shayari(id) ON DELETE CASCADE NOT NULL,
  sort_order integer DEFAULT 0
);

-- Ebooks table
CREATE TABLE IF NOT EXISTS ebooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  poet_id uuid REFERENCES poets(id) ON DELETE SET NULL,
  poet_name text,
  titles jsonb NOT NULL,
  descriptions jsonb NOT NULL,
  cover_image text,
  pages integer DEFAULT 0,
  file_url_pdf text,
  file_url_epub text,
  created_at timestamptz DEFAULT now()
);

-- Dictionary entries
CREATE TABLE IF NOT EXISTS dictionary_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word_key text UNIQUE NOT NULL,
  word_urdu text,
  word_roman text,
  word_hindi text,
  word_english text,
  part_of_speech text,
  pronunciation text,
  meanings_english jsonb DEFAULT '[]'::jsonb,
  meanings_urdu jsonb DEFAULT '[]'::jsonb,
  notes text,
  synonyms jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shayari_id uuid REFERENCES shayari(id) ON DELETE CASCADE NOT NULL,
  user_name text NOT NULL,
  message_text text NOT NULL,
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Ad slots
CREATE TABLE IF NOT EXISTS ad_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  html_snippet text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shayari_poet_id ON shayari(poet_id);
CREATE INDEX IF NOT EXISTS idx_shayari_form ON shayari(form);
CREATE INDEX IF NOT EXISTS idx_shayari_trending ON shayari(is_trending) WHERE is_trending = true;
CREATE INDEX IF NOT EXISTS idx_shayari_featured ON shayari(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_shayari_popularity ON shayari(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_shayari_created_at ON shayari(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shayari_language_versions_shayari_id ON shayari_language_versions(shayari_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_shayari_id ON chat_messages(shayari_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id ON collection_items(collection_id);

-- Enable Row Level Security
ALTER TABLE poets ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE shayari ENABLE ROW LEVEL SECURITY;
ALTER TABLE shayari_language_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shayari_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE dictionary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_slots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access
CREATE POLICY "Allow public read access to poets"
  ON poets FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to topics"
  ON topics FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to shayari"
  ON shayari FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to shayari language versions"
  ON shayari_language_versions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to shayari topics"
  ON shayari_topics FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to collections"
  ON collections FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to collection items"
  ON collection_items FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to ebooks"
  ON ebooks FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to dictionary entries"
  ON dictionary_entries FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to chat messages"
  ON chat_messages FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to ad slots"
  ON ad_slots FOR SELECT
  TO public
  USING (true);
