ALTER TABLE public.travel_photos
  ADD COLUMN IF NOT EXISTS favorite_id uuid REFERENCES public.travel_favorites(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS travel_photos_favorite_id_idx ON public.travel_photos(favorite_id);
