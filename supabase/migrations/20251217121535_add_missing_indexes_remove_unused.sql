/*
  # Database Performance and Security Optimization

  ## Changes

  1. **Add Missing Foreign Key Indexes**
     - Add index on `collection_items.shayari_id` for better JOIN performance
     - Add index on `ebooks.poet_id` for better JOIN performance
     - Add index on `shayari_topics.topic_id` for queries filtering by topic

  2. **Remove Unused Indexes**
     - Drop `idx_shayari_form` (unused, queries don't filter by form frequently)
     - Drop `idx_shayari_trending` (unused, trending queries are infrequent)
     - Drop `idx_shayari_featured` (unused, featured queries are infrequent)
     - Drop `idx_shayari_popularity` (unused, popularity sorting is rare)
     - Drop `idx_chat_messages_shayari_id` (unused, chat feature not active)
     - Drop `idx_collection_items_collection_id` (redundant, covered by composite unique index)

  ## Performance Impact

  - **Improved:** Foreign key JOINs will be faster with proper indexes
  - **Reduced:** Database size and maintenance overhead from unused indexes
  - **Optimized:** Query planner has fewer index options to consider

  ## Security Notes

  - This migration addresses Supabase security warnings about unindexed foreign keys
  - Auth configuration settings must be changed in Supabase dashboard (not via migration):
    * Auth DB Connection Strategy: Switch to percentage-based allocation
    * Leaked Password Protection: Enable HaveIBeenPwned.org checking
*/

-- Add missing foreign key indexes for better JOIN performance

-- Index for collection_items.shayari_id (foreign key to shayari)
CREATE INDEX IF NOT EXISTS idx_collection_items_shayari_id 
ON collection_items(shayari_id);

-- Index for ebooks.poet_id (foreign key to poets)
CREATE INDEX IF NOT EXISTS idx_ebooks_poet_id 
ON ebooks(poet_id);

-- Index for shayari_topics.topic_id (foreign key to topics)
CREATE INDEX IF NOT EXISTS idx_shayari_topics_topic_id 
ON shayari_topics(topic_id);

-- Remove unused indexes to reduce maintenance overhead

-- Drop unused shayari indexes
DROP INDEX IF EXISTS idx_shayari_form;
DROP INDEX IF EXISTS idx_shayari_trending;
DROP INDEX IF EXISTS idx_shayari_featured;
DROP INDEX IF EXISTS idx_shayari_popularity;

-- Drop unused chat messages index (chat feature not active)
DROP INDEX IF EXISTS idx_chat_messages_shayari_id;

-- Drop redundant collection_items index (covered by composite unique constraint)
DROP INDEX IF EXISTS idx_collection_items_collection_id;
