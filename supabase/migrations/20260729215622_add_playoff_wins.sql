-- Add playoff_wins column to dynasty_leaderboard_entries
ALTER TABLE dynasty_leaderboard_entries ADD COLUMN playoff_wins INT NOT NULL DEFAULT 0;

-- Create index for playoff_wins for faster queries
CREATE INDEX idx_dynasty_leaderboard_playoff_wins ON dynasty_leaderboard_entries(playoff_wins DESC, wins DESC, rating DESC);
