CREATE TABLE IF NOT EXISTS public.dynasty_leaderboard_entries (
  id text PRIMARY KEY,
  team_name text NOT NULL CHECK (char_length(team_name) BETWEEN 1 AND 40),
  rating numeric(4,1) NOT NULL CHECK (rating >= 0 AND rating <= 100),
  wins integer NOT NULL CHECK (wins >= 0 AND wins <= 17),
  losses integer NOT NULL CHECK (losses >= 0 AND losses <= 17),
  finish text NOT NULL,
  players jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dynasty_leaderboard_record_length CHECK (wins + losses = 17),
  CONSTRAINT dynasty_leaderboard_players_shape CHECK (
    players ? 'QB'
    AND players ? 'RB'
    AND players ? 'WR'
    AND players ? 'TE'
    AND players ? 'DST'
  )
);

ALTER TABLE public.dynasty_leaderboard_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage dynasty leaderboard"
  ON public.dynasty_leaderboard_entries
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS dynasty_leaderboard_entries_rank_idx
  ON public.dynasty_leaderboard_entries (rating DESC, wins DESC, created_at ASC);
