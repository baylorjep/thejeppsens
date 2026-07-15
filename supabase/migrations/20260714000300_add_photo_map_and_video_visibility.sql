ALTER TABLE public.travel_photos
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

ALTER TABLE public.travel_videos
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'unlisted'
    CHECK (visibility IN ('unlisted', 'public', 'private', 'unknown'));
