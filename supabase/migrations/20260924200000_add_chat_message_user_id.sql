ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS user_id text;

COMMENT ON COLUMN public.chat_messages.user_id IS
  'Stable client-local chat user ID. Nullable for messages created before this column was added.';
