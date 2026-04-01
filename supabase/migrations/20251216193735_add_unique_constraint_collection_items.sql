/*
  # Add Unique Constraint to Collection Items

  1. Changes
    - Add unique constraint on (collection_id, shayari_id) to prevent duplicate items in collections
    - This ensures each shayari can only appear once per collection
  
  2. Security
    - No changes to RLS policies (already configured)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'collection_items_collection_id_shayari_id_key'
  ) THEN
    ALTER TABLE collection_items 
    ADD CONSTRAINT collection_items_collection_id_shayari_id_key 
    UNIQUE (collection_id, shayari_id);
  END IF;
END $$;