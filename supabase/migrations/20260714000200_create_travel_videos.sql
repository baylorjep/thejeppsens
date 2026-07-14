CREATE TABLE IF NOT EXISTS public.travel_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id uuid NOT NULL REFERENCES public.visited_countries(id) ON DELETE CASCADE,
  state_id uuid REFERENCES public.visited_states(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES public.travel_trips(id) ON DELETE SET NULL,
  title text NOT NULL,
  url text NOT NULL,
  provider text NOT NULL DEFAULT 'youtube',
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.travel_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON public.travel_videos FOR ALL USING (true) WITH CHECK (true);
