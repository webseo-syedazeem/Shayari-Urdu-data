/*
  # Add UPDATE and DELETE Policies for Admin Operations

  ## Changes
  - Add UPDATE policies for all tables to allow public updates (for admin panel)
  - Add DELETE policies for all tables to allow public deletes (for admin panel)

  ## Security Note
  These policies are permissive for development purposes.
  In production, these should be restricted to authenticated admin users.
*/

-- Poets
CREATE POLICY "Allow public update to poets"
  ON poets FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from poets"
  ON poets FOR DELETE
  TO public
  USING (true);

-- Topics
CREATE POLICY "Allow public update to topics"
  ON topics FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from topics"
  ON topics FOR DELETE
  TO public
  USING (true);

-- Shayari
CREATE POLICY "Allow public update to shayari"
  ON shayari FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from shayari"
  ON shayari FOR DELETE
  TO public
  USING (true);

-- Shayari language versions
CREATE POLICY "Allow public update to shayari language versions"
  ON shayari_language_versions FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from shayari language versions"
  ON shayari_language_versions FOR DELETE
  TO public
  USING (true);

-- Shayari topics
CREATE POLICY "Allow public delete from shayari topics"
  ON shayari_topics FOR DELETE
  TO public
  USING (true);

-- Collections
CREATE POLICY "Allow public update to collections"
  ON collections FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from collections"
  ON collections FOR DELETE
  TO public
  USING (true);

-- Collection items
CREATE POLICY "Allow public delete from collection items"
  ON collection_items FOR DELETE
  TO public
  USING (true);

-- Ebooks
CREATE POLICY "Allow public update to ebooks"
  ON ebooks FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from ebooks"
  ON ebooks FOR DELETE
  TO public
  USING (true);

-- Dictionary entries
CREATE POLICY "Allow public update to dictionary entries"
  ON dictionary_entries FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from dictionary entries"
  ON dictionary_entries FOR DELETE
  TO public
  USING (true);

-- Ad slots
CREATE POLICY "Allow public update to ad slots"
  ON ad_slots FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from ad slots"
  ON ad_slots FOR DELETE
  TO public
  USING (true);
