/*
  # Chat Messages Data Retention Policy

  ## Changes

  1. **Add index on `chat_messages.created_at`**
     - Required for an efficient cutoff lookup and range delete (avoids full
       table scans as the table grows).

  2. **Add `trim_chat_messages()` function**
     - Deletes all rows in `chat_messages` except the newest 100,000
       (ordered by `created_at`).
     - Finds the cutoff via `ORDER BY created_at DESC OFFSET 100000 LIMIT 1`
       and deletes everything older than that timestamp, so the DELETE
       itself is a simple indexed range scan rather than a full scan.
     - `SECURITY DEFINER` with a locked-down `search_path` so it runs with
       the privileges needed to delete regardless of caller/RLS.

  3. **Schedule periodic cleanup**
     - Preferred path: enable `pg_cron` and schedule `trim_chat_messages()`
       to run hourly via `cron.schedule(...)`.
     - Fallback path: if `pg_cron` cannot be enabled on this project/plan,
       fall back to an `AFTER INSERT` trigger that only runs the cleanup
       on every 1000th insert (via a dedicated sequence + modulo check),
       instead of on every single insert.
     - Which path was taken is determined at migration time by checking
       `pg_extension` after attempting `CREATE EXTENSION IF NOT EXISTS pg_cron`,
       so this migration is self-adapting and does not need to be edited
       per-environment.

  ## Notes

  - This is a hard cap: rows beyond the newest 100,000 are permanently
    deleted, not archived.
  - The cutoff is timestamp-based, so if multiple rows share the exact same
    `created_at` at the boundary, the kept row count may differ from
    exactly 100,000 by a negligible amount. Acceptable for a retention cap.
*/

-- 1. Index needed for the cutoff lookup and the delete's range scan
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at
  ON chat_messages (created_at);

-- 2. Cleanup function: deletes all but the newest 100,000 rows
CREATE OR REPLACE FUNCTION trim_chat_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  cutoff_created_at timestamptz;
BEGIN
  SELECT created_at INTO cutoff_created_at
  FROM chat_messages
  ORDER BY created_at DESC
  OFFSET 100000
  LIMIT 1;

  IF cutoff_created_at IS NOT NULL THEN
    DELETE FROM chat_messages
    WHERE created_at < cutoff_created_at;
  END IF;
END;
$$;

-- 3. Try pg_cron first; fall back to a throttled trigger if unavailable
DO $$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron extension could not be enabled (%), will use trigger-based fallback', SQLERRM;
  END;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- pg_cron is available: schedule hourly cleanup (idempotent re-schedule by name)
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'trim-chat-messages-hourly') THEN
      PERFORM cron.unschedule('trim-chat-messages-hourly');
    END IF;

    PERFORM cron.schedule(
      'trim-chat-messages-hourly',
      '0 * * * *',
      $cron$SELECT trim_chat_messages();$cron$
    );

    -- Make sure no leftover fallback trigger from a prior run is still active
    DROP TRIGGER IF EXISTS trim_chat_messages_after_insert ON chat_messages;
  ELSE
    -- pg_cron unavailable: fall back to a throttled AFTER INSERT trigger
    -- that runs the cleanup on every 1000th insert instead of every insert.
    CREATE SEQUENCE IF NOT EXISTS chat_messages_insert_counter;

    CREATE OR REPLACE FUNCTION trim_chat_messages_trigger_fn()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, pg_catalog
    AS $trigger$
    BEGIN
      IF nextval('chat_messages_insert_counter') % 1000 = 0 THEN
        PERFORM trim_chat_messages();
      END IF;
      RETURN NEW;
    END;
    $trigger$;

    DROP TRIGGER IF EXISTS trim_chat_messages_after_insert ON chat_messages;

    CREATE TRIGGER trim_chat_messages_after_insert
      AFTER INSERT ON chat_messages
      FOR EACH ROW
      EXECUTE FUNCTION trim_chat_messages_trigger_fn();
  END IF;
END;
$$;
