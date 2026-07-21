ALTER TABLE public.travel_photos
  ADD COLUMN IF NOT EXISTS favorite_location_id uuid REFERENCES public.travel_favorite_locations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS travel_photos_favorite_location_id_idx
  ON public.travel_photos(favorite_location_id);
