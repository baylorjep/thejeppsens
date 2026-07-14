ALTER TABLE public.travel_photos
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
