/*
  # Add Write Policies for Database Seeding

  ## Changes
  - Add INSERT policies for all tables to allow public inserts (for seeding/development)
  - These can be restricted later when authentication is implemented

  ## Security Note
  These policies are permissive for development/seeding purposes.
  In production, these should be restricted to authenticated admin users.
*/

-- Poets
CREATE POLICY "Allow public insert to poets"
  ON poets FOR INSERT
  TO public
  WITH CHECK (true);

-- Topics
CREATE POLICY "Allow public insert to topics"
  ON topics FOR INSERT
  TO public
  WITH CHECK (true);

-- Shayari
CREATE POLICY "Allow public insert to shayari"
  ON shayari FOR INSERT
  TO public
  WITH CHECK (true);

-- Shayari language versions
CREATE POLICY "Allow public insert to shayari language versions"
  ON shayari_language_versions FOR INSERT
  TO public
  WITH CHECK (true);

-- Shayari topics
CREATE POLICY "Allow public insert to shayari topics"
  ON shayari_topics FOR INSERT
  TO public
  WITH CHECK (true);

-- Collections
CREATE POLICY "Allow public insert to collections"
  ON collections FOR INSERT
  TO public
  WITH CHECK (true);

-- Collection items
CREATE POLICY "Allow public insert to collection items"
  ON collection_items FOR INSERT
  TO public
  WITH CHECK (true);

-- Ebooks
CREATE POLICY "Allow public insert to ebooks"
  ON ebooks FOR INSERT
  TO public
  WITH CHECK (true);

-- Dictionary entries
CREATE POLICY "Allow public insert to dictionary entries"
  ON dictionary_entries FOR INSERT
  TO public
  WITH CHECK (true);

-- Chat messages
CREATE POLICY "Allow public insert to chat messages"
  ON chat_messages FOR INSERT
  TO public
  WITH CHECK (true);

-- Ad slots
CREATE POLICY "Allow public insert to ad slots"
  ON ad_slots FOR INSERT
  TO public
  WITH CHECK (true);
