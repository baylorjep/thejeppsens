ALTER TABLE public.travel_photos
  ADD COLUMN IF NOT EXISTS image_hash text;

CREATE INDEX IF NOT EXISTS travel_photos_image_hash_idx
  ON public.travel_photos(image_hash)
  WHERE image_hash IS NOT NULL;
