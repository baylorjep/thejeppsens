UPDATE public.visited_countries
SET baylor_visited = true,
    isabel_visited = true
WHERE geo_name IN ('Vatican', 'Bahamas');
