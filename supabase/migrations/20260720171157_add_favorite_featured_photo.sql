ALTER TABLE public.travel_photos
  ADD COLUMN IF NOT EXISTS is_favorite_featured boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS travel_photos_one_featured_per_favorite_idx
  ON public.travel_photos(favorite_id)
  WHERE is_favorite_featured = true AND favorite_id IS NOT NULL;
