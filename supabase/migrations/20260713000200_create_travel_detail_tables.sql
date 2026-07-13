CREATE TABLE IF NOT EXISTS public.travel_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id uuid NOT NULL REFERENCES public.visited_countries(id) ON DELETE CASCADE,
  title text NOT NULL,
  location_name text,
  started_on date,
  ended_on date,
  notes text,
  baylor_went boolean NOT NULL DEFAULT false,
  isabel_went boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.travel_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id uuid NOT NULL REFERENCES public.visited_countries(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES public.travel_trips(id) ON DELETE SET NULL,
  image_url text NOT NULL,
  caption text,
  location_name text,
  taken_on date,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.travel_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id uuid NOT NULL REFERENCES public.visited_countries(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES public.travel_trips(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('restaurant', 'activity', 'place')),
  name text NOT NULL,
  location_name text,
  latitude double precision,
  longitude double precision,
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.visited_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_name text NOT NULL UNIQUE,
  abbreviation text NOT NULL UNIQUE,
  baylor_visited boolean NOT NULL DEFAULT false,
  isabel_visited boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.travel_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visited_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON public.travel_trips FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.travel_photos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.travel_favorites FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.visited_states FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.visited_states (state_name, abbreviation) VALUES
  ('Alabama', 'AL'),
  ('Alaska', 'AK'),
  ('Arizona', 'AZ'),
  ('Arkansas', 'AR'),
  ('California', 'CA'),
  ('Colorado', 'CO'),
  ('Connecticut', 'CT'),
  ('Delaware', 'DE'),
  ('Florida', 'FL'),
  ('Georgia', 'GA'),
  ('Hawaii', 'HI'),
  ('Idaho', 'ID'),
  ('Illinois', 'IL'),
  ('Indiana', 'IN'),
  ('Iowa', 'IA'),
  ('Kansas', 'KS'),
  ('Kentucky', 'KY'),
  ('Louisiana', 'LA'),
  ('Maine', 'ME'),
  ('Maryland', 'MD'),
  ('Massachusetts', 'MA'),
  ('Michigan', 'MI'),
  ('Minnesota', 'MN'),
  ('Mississippi', 'MS'),
  ('Missouri', 'MO'),
  ('Montana', 'MT'),
  ('Nebraska', 'NE'),
  ('Nevada', 'NV'),
  ('New Hampshire', 'NH'),
  ('New Jersey', 'NJ'),
  ('New Mexico', 'NM'),
  ('New York', 'NY'),
  ('North Carolina', 'NC'),
  ('North Dakota', 'ND'),
  ('Ohio', 'OH'),
  ('Oklahoma', 'OK'),
  ('Oregon', 'OR'),
  ('Pennsylvania', 'PA'),
  ('Rhode Island', 'RI'),
  ('South Carolina', 'SC'),
  ('South Dakota', 'SD'),
  ('Tennessee', 'TN'),
  ('Texas', 'TX'),
  ('Utah', 'UT'),
  ('Vermont', 'VT'),
  ('Virginia', 'VA'),
  ('Washington', 'WA'),
  ('West Virginia', 'WV'),
  ('Wisconsin', 'WI'),
  ('Wyoming', 'WY')
ON CONFLICT (state_name) DO NOTHING;
