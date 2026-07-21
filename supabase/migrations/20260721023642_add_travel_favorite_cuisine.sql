ALTER TABLE public.travel_favorites
  ADD COLUMN IF NOT EXISTS cuisine text;
