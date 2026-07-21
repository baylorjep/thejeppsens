CREATE TABLE IF NOT EXISTS public.travel_favorite_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  favorite_id uuid NOT NULL REFERENCES public.travel_favorites(id) ON DELETE CASCADE,
  country_id uuid NOT NULL REFERENCES public.visited_countries(id) ON DELETE CASCADE,
  state_id uuid REFERENCES public.visited_states(id) ON DELETE SET NULL,
  name text,
  location_name text,
  address text,
  latitude double precision,
  longitude double precision,
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.travel_favorite_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON public.travel_favorite_locations
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS travel_favorite_locations_favorite_id_idx
  ON public.travel_favorite_locations(favorite_id);

CREATE INDEX IF NOT EXISTS travel_favorite_locations_country_state_idx
  ON public.travel_favorite_locations(country_id, state_id);
