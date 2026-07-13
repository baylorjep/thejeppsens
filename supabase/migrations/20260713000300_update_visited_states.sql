UPDATE public.visited_states
SET baylor_visited = true,
    isabel_visited = true
WHERE state_name IN (
  'Utah',
  'Nevada',
  'California',
  'North Carolina',
  'South Carolina',
  'Florida',
  'Virginia',
  'New York',
  'Idaho',
  'Hawaii'
);

UPDATE public.visited_states
SET baylor_visited = true
WHERE state_name IN (
  'Tennessee',
  'Arizona',
  'Texas',
  'Pennsylvania',
  'New Jersey',
  'Massachusetts'
);
