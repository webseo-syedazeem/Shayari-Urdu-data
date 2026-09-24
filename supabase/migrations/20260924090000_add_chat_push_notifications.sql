CREATE TABLE IF NOT EXISTS public.push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_id text NOT NULL UNIQUE,
  chat_username text NOT NULL,
  expo_push_token text NOT NULL UNIQUE,
  push_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS push_tokens_enabled_username_idx
  ON public.push_tokens (push_enabled, chat_username);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.push_tokens FROM anon, authenticated;

COMMENT ON TABLE public.push_tokens IS
  'Expo push tokens registered per app installation. Access is limited to the registration RPC and service role.';

CREATE OR REPLACE FUNCTION public.register_push_token(
  p_chat_username text,
  p_expo_push_token text,
  p_installation_id text,
  p_push_enabled boolean DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  normalized_username text := btrim(p_chat_username);
  resolved_enabled boolean;
BEGIN
  IF char_length(normalized_username) < 2 OR char_length(normalized_username) > 30 THEN
    RAISE EXCEPTION 'Chat username must contain 2 to 30 characters';
  END IF;

  IF p_expo_push_token IS NULL
     OR p_expo_push_token !~ '^(Expo|Exponent)PushToken\[[^]]+\]$' THEN
    RAISE EXCEPTION 'Invalid Expo push token';
  END IF;

  IF p_installation_id IS NULL
     OR char_length(p_installation_id) < 20
     OR char_length(p_installation_id) > 200 THEN
    RAISE EXCEPTION 'Invalid installation identifier';
  END IF;

  -- A token can roll to a new installation identifier after a restore/reinstall.
  DELETE FROM public.push_tokens
  WHERE expo_push_token = p_expo_push_token
    AND installation_id <> p_installation_id;

  INSERT INTO public.push_tokens (
    installation_id,
    chat_username,
    expo_push_token,
    push_enabled,
    updated_at
  )
  VALUES (
    p_installation_id,
    normalized_username,
    p_expo_push_token,
    COALESCE(p_push_enabled, true),
    now()
  )
  ON CONFLICT (installation_id) DO UPDATE
  SET chat_username = EXCLUDED.chat_username,
      expo_push_token = EXCLUDED.expo_push_token,
      push_enabled = COALESCE(p_push_enabled, public.push_tokens.push_enabled),
      updated_at = now()
  RETURNING push_enabled INTO resolved_enabled;

  RETURN resolved_enabled;
END;
$$;

REVOKE ALL ON FUNCTION public.register_push_token(text, text, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_push_token(text, text, text, boolean)
  TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.expo_push_tickets (
  ticket_id text PRIMARY KEY,
  expo_push_token text NOT NULL
    REFERENCES public.push_tokens (expo_push_token) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS expo_push_tickets_created_at_idx
  ON public.expo_push_tickets (created_at);

ALTER TABLE public.expo_push_tickets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.expo_push_tickets FROM anon, authenticated;

COMMENT ON TABLE public.expo_push_tickets IS
  'Successful Expo push ticket IDs retained until the backend worker checks their receipts.';
