ALTER TABLE public.travel_trips
  ADD COLUMN IF NOT EXISTS state_id uuid REFERENCES public.visited_states(id) ON DELETE CASCADE;

ALTER TABLE public.travel_photos
  ADD COLUMN IF NOT EXISTS state_id uuid REFERENCES public.visited_states(id) ON DELETE CASCADE;

ALTER TABLE public.travel_favorites
  ADD COLUMN IF NOT EXISTS state_id uuid REFERENCES public.visited_states(id) ON DELETE CASCADE;
