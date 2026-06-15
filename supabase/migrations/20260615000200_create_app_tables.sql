-- Restaurants
CREATE TABLE IF NOT EXISTS public.restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cuisine text NOT NULL DEFAULT '',
  price text NOT NULL DEFAULT '$$',
  distance text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.restaurants FOR ALL USING (true) WITH CHECK (true);

-- Movies
CREATE TABLE IF NOT EXISTS public.movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  genre text NOT NULL DEFAULT '',
  length text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'live-action',
  poster text,
  trailer text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.movies FOR ALL USING (true) WITH CHECK (true);

-- Visited countries
CREATE TABLE IF NOT EXISTS public.visited_countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  geo_name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  flag text NOT NULL DEFAULT '',
  continent text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.visited_countries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.visited_countries FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.visited_countries (geo_name, display_name, flag, continent) VALUES
  ('United States of America', 'United States',    '🇺🇸', 'Americas'),
  ('Mexico',                   'Mexico',            '🇲🇽', 'Americas'),
  ('Dominican Rep.',           'Dominican Republic','🇩🇴', 'Americas'),
  ('Cuba',                     'Cuba',              '🇨🇺', 'Americas'),
  ('France',                   'France',            '🇫🇷', 'Europe'),
  ('Germany',                  'Germany',           '🇩🇪', 'Europe'),
  ('Austria',                  'Austria',           '🇦🇹', 'Europe'),
  ('Switzerland',              'Switzerland',       '🇨🇭', 'Europe'),
  ('Belgium',                  'Belgium',           '🇧🇪', 'Europe'),
  ('Netherlands',              'Netherlands',       '🇳🇱', 'Europe'),
  ('Luxembourg',               'Luxembourg',        '🇱🇺', 'Europe'),
  ('Czechia',                  'Czech Republic',    '🇨🇿', 'Europe'),
  ('United Kingdom',           'England',           '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Europe'),
  ('Italy',                    'Italy',             '🇮🇹', 'Europe'),
  ('Greece',                   'Greece',            '🇬🇷', 'Europe'),
  ('Turkey',                   'Turkey',            '🇹🇷', 'Europe'),
  ('Australia',                'Australia',         '🇦🇺', 'Oceania')
ON CONFLICT (geo_name) DO NOTHING;
