UPDATE public.visited_states
SET isabel_visited = true
WHERE state_name IN (
  'Oregon',
  'Wyoming',
  'Arizona',
  'Colorado',
  'Texas',
  'New Jersey'
);
