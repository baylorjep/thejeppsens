INSERT INTO storage.buckets (id, name, public)
VALUES ('travel-photos', 'travel-photos', true)
ON CONFLICT (id) DO NOTHING;

UPDATE public.visited_states
SET baylor_visited = true
WHERE state_name = 'Colorado';
