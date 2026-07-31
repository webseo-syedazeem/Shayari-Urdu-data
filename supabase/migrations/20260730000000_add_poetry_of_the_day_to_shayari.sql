ALTER TABLE public.shayari
ADD COLUMN IF NOT EXISTS is_poetry_of_the_day boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_shayari_poetry_of_the_day
ON public.shayari (created_at DESC)
WHERE is_poetry_of_the_day = true;
