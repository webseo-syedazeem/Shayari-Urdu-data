/*
  # Remove Trending feature

  The "Trending Shayari Today" section has been removed from the site
  (frontend, backend API, and admin panel). This migration drops the
  now-unused `is_trending` column from `shayari`.

  Note: the `idx_shayari_trending` index was already dropped in
  20251217121535_add_missing_indexes_remove_unused.sql.
*/

ALTER TABLE public.shayari
DROP COLUMN IF EXISTS is_trending;
