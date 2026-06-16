ALTER TABLE visited_countries
  ADD COLUMN IF NOT EXISTS baylor_visited boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS isabel_visited boolean NOT NULL DEFAULT true;
