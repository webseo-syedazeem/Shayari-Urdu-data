CREATE TABLE IF NOT EXISTS public.chat_user_profiles (
  user_id text PRIMARY KEY,
  username text,
  name_changes_remaining integer NOT NULL DEFAULT 3
    CHECK (name_changes_remaining BETWEEN 0 AND 3),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_user_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.chat_user_profiles FROM anon, authenticated;

COMMENT ON TABLE public.chat_user_profiles IS
  'Server-side chat username rename allowance keyed by the client-stable chat user ID.';

CREATE OR REPLACE FUNCTION public.rename_chat_username(
  p_user_id text,
  p_new_username text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  normalized_user_id text := btrim(p_user_id);
  normalized_username text := btrim(p_new_username);
  remaining_count integer;
BEGIN
  IF normalized_user_id IS NULL
     OR char_length(normalized_user_id) = 0
     OR char_length(normalized_user_id) > 200 THEN
    RAISE EXCEPTION 'Invalid chat user identifier' USING ERRCODE = '22023';
  END IF;

  IF normalized_username IS NULL
     OR char_length(normalized_username) < 2
     OR char_length(normalized_username) > 30 THEN
    RAISE EXCEPTION 'Chat username must contain 2 to 30 characters'
      USING ERRCODE = '22023';
  END IF;

  -- This insert serializes concurrent first-renames through the primary key.
  -- The conditional UPDATE is the only operation that consumes an allowance.
  INSERT INTO public.chat_user_profiles (user_id, username)
  VALUES (normalized_user_id, normalized_username)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.chat_user_profiles
  SET username = normalized_username,
      name_changes_remaining = name_changes_remaining - 1,
      updated_at = now()
  WHERE user_id = normalized_user_id
    AND name_changes_remaining > 0
  RETURNING name_changes_remaining INTO remaining_count;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'remaining', remaining_count
    );
  END IF;

  SELECT name_changes_remaining
  INTO remaining_count
  FROM public.chat_user_profiles
  WHERE user_id = normalized_user_id;

  RETURN jsonb_build_object(
    'success', false,
    'remaining', COALESCE(remaining_count, 0)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_name_changes_remaining(
  p_user_id text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  normalized_user_id text := btrim(p_user_id);
  remaining_count integer;
BEGIN
  IF normalized_user_id IS NULL
     OR char_length(normalized_user_id) = 0
     OR char_length(normalized_user_id) > 200 THEN
    RAISE EXCEPTION 'Invalid chat user identifier' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.chat_user_profiles (user_id)
  VALUES (normalized_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT name_changes_remaining
  INTO remaining_count
  FROM public.chat_user_profiles
  WHERE user_id = normalized_user_id;

  RETURN remaining_count;
END;
$$;

REVOKE ALL ON FUNCTION public.rename_chat_username(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_name_changes_remaining(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.rename_chat_username(text, text)
  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_name_changes_remaining(text)
  TO anon, authenticated;
