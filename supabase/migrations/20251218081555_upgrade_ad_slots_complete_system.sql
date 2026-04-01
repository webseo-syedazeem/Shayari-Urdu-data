/*
  # Upgrade Ad Slots for Complete Ad System

  ## Changes Made

  1. Ad Slots Table Enhancement
    - Add `placement` column (text, required) - where the ad appears
    - Add `page_scope` column (text, required) - which page(s) it applies to
    - Add `priority` column (integer, default 0) - higher wins when multiple match
    - Add `frequency` column (integer, default 6) - for between-cards ads
    - Make existing columns properly constrained

  2. Valid Values
    - Placement: header, home_hero_top, sidebar, footer, between_shayari_cards
    - Page Scope: global, home, explore, poet_detail, topic_detail, collection_detail, shayari_detail, ebooks, ebook_detail, dictionary, dictionary_detail

  3. Default Ad Slots
    - Insert default slots for common placements (inactive by default)
    - Helps admins see available slots immediately

  4. Security
    - Existing RLS policies remain in place
    - Public read access for active ad slots
    - Admin-only write access
*/

-- Add new columns to ad_slots table
ALTER TABLE ad_slots 
  ADD COLUMN IF NOT EXISTS placement text,
  ADD COLUMN IF NOT EXISTS page_scope text,
  ADD COLUMN IF NOT EXISTS priority integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS frequency integer DEFAULT 6;

-- Make placement and page_scope required (after adding them)
DO $$
BEGIN
  -- First, set default values for existing rows if any
  UPDATE ad_slots 
  SET placement = 'home_hero_top', 
      page_scope = 'home'
  WHERE placement IS NULL OR page_scope IS NULL;

  -- Now make them NOT NULL
  ALTER TABLE ad_slots ALTER COLUMN placement SET NOT NULL;
  ALTER TABLE ad_slots ALTER COLUMN page_scope SET NOT NULL;
END $$;

-- Add check constraints for valid values
DO $$
BEGIN
  -- Drop constraints if they exist (for idempotency)
  ALTER TABLE ad_slots DROP CONSTRAINT IF EXISTS ad_slots_placement_check;
  ALTER TABLE ad_slots DROP CONSTRAINT IF EXISTS ad_slots_page_scope_check;

  -- Add new constraints
  ALTER TABLE ad_slots ADD CONSTRAINT ad_slots_placement_check 
    CHECK (placement IN ('header', 'home_hero_top', 'sidebar', 'footer', 'between_shayari_cards'));

  ALTER TABLE ad_slots ADD CONSTRAINT ad_slots_page_scope_check 
    CHECK (page_scope IN ('global', 'home', 'explore', 'poet_detail', 'topic_detail', 'collection_detail', 'shayari_detail', 'ebooks', 'ebook_detail', 'dictionary', 'dictionary_detail'));
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ad_slots_placement ON ad_slots(placement);
CREATE INDEX IF NOT EXISTS idx_ad_slots_page_scope ON ad_slots(page_scope);
CREATE INDEX IF NOT EXISTS idx_ad_slots_active_placement ON ad_slots(is_active, placement, page_scope);
CREATE INDEX IF NOT EXISTS idx_ad_slots_priority ON ad_slots(priority DESC);

-- Insert default ad slots (inactive by default to avoid showing empty ads)
INSERT INTO ad_slots (key, title, description, placement, page_scope, is_active, priority, frequency, html_snippet)
VALUES
  -- Global Header
  ('global_header_1', 'Global Header Ad', 'Appears below navigation on all pages', 'header', 'global', false, 100, 6, '<!-- Add your header ad code here -->'),
  
  -- Home Hero Top
  ('home_hero_top_1', 'Home Hero Top Banner', 'Featured banner below hero section on home page', 'home_hero_top', 'home', false, 100, 6, '<!-- Add your home hero banner ad code here -->'),
  
  -- Global Footer
  ('global_footer_1', 'Global Footer Ad', 'Appears above footer on all pages', 'footer', 'global', false, 100, 6, '<!-- Add your footer ad code here -->'),
  
  -- Sidebar Ads
  ('explore_sidebar_1', 'Explore Sidebar Ad', 'Right sidebar on explore page', 'sidebar', 'explore', false, 100, 6, '<!-- Add your explore sidebar ad code here -->'),
  ('poet_sidebar_1', 'Poet Detail Sidebar Ad', 'Right sidebar on poet detail page', 'sidebar', 'poet_detail', false, 100, 6, '<!-- Add your poet sidebar ad code here -->'),
  ('topic_sidebar_1', 'Topic Detail Sidebar Ad', 'Right sidebar on topic detail page', 'sidebar', 'topic_detail', false, 100, 6, '<!-- Add your topic sidebar ad code here -->'),
  ('collection_sidebar_1', 'Collection Detail Sidebar Ad', 'Right sidebar on collection detail page', 'sidebar', 'collection_detail', false, 100, 6, '<!-- Add your collection sidebar ad code here -->'),
  
  -- Between Cards Ads
  ('between_cards_global_1', 'Between Cards - Global', 'Shows between shayari cards globally (every 6 cards)', 'between_shayari_cards', 'global', false, 50, 6, '<!-- Add your between-cards ad code here -->'),
  ('between_cards_explore_1', 'Between Cards - Explore', 'Shows between shayari cards on explore page (every 6 cards)', 'between_shayari_cards', 'explore', false, 100, 6, '<!-- Add your explore between-cards ad code here -->'),
  ('between_cards_home_1', 'Between Cards - Home', 'Shows between shayari cards on home page (every 6 cards)', 'between_shayari_cards', 'home', false, 100, 6, '<!-- Add your home between-cards ad code here -->')
ON CONFLICT (key) DO UPDATE SET
  placement = EXCLUDED.placement,
  page_scope = EXCLUDED.page_scope,
  priority = EXCLUDED.priority,
  frequency = EXCLUDED.frequency
WHERE ad_slots.placement IS NULL OR ad_slots.page_scope IS NULL;

-- Update RLS policies for public read access to active ad slots
DROP POLICY IF EXISTS "Allow public read access to active ad slots" ON ad_slots;

CREATE POLICY "Allow public read access to active ad slots"
  ON ad_slots
  FOR SELECT
  USING (is_active = true);
