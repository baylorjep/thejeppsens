import { VinylRecord } from "@/data/vinyls";

export type AchievementMetric =
  | "owned"
  | "favorites"
  | "artists"
  | "genres"
  | "discogsLinked"
  | "discogsVerified"
  | "collectionValue";

export type AchievementCategory =
  | "collection"
  | "favorites"
  | "artists"
  | "genres"
  | "discogsLinked"
  | "discogsVerified"
  | "value";

export type Achievement = {
  id: string;
  category: AchievementCategory;
  metric: AchievementMetric;
  threshold: number;
  emoji: string;
  title: string;
  description: string;
};

export const ACHIEVEMENTS: Achievement[] = [
  // Collection size
  { id: "owned-25", category: "collection", metric: "owned", threshold: 25, emoji: "💿", title: "Crate Starter", description: "Own 25 records" },
  { id: "owned-50", category: "collection", metric: "owned", threshold: 50, emoji: "💿", title: "Getting Serious", description: "Own 50 records" },
  { id: "owned-100", category: "collection", metric: "owned", threshold: 100, emoji: "📀", title: "Century Club", description: "Own 100 records" },
  { id: "owned-150", category: "collection", metric: "owned", threshold: 150, emoji: "📀", title: "Deep Cuts", description: "Own 150 records" },
  { id: "owned-200", category: "collection", metric: "owned", threshold: 200, emoji: "🏆", title: "Curator", description: "Own 200 records" },
  { id: "owned-250", category: "collection", metric: "owned", threshold: 250, emoji: "🎉", title: "Quarter Thousand", description: "Own 250 records" },
  { id: "owned-300", category: "collection", metric: "owned", threshold: 300, emoji: "🌟", title: "300 Strong", description: "Own 300 records" },
  { id: "owned-400", category: "collection", metric: "owned", threshold: 400, emoji: "🚀", title: "400 Deep", description: "Own 400 records" },
  { id: "owned-500", category: "collection", metric: "owned", threshold: 500, emoji: "👑", title: "Half a Thousand", description: "Own 500 records" },

  // Favorites
  { id: "fav-10", category: "favorites", metric: "favorites", threshold: 10, emoji: "❤️", title: "Picking Favorites", description: "Mark 10 favorites" },
  { id: "fav-25", category: "favorites", metric: "favorites", threshold: 25, emoji: "❤️", title: "Favorites, Plural", description: "Mark 25 favorites" },
  { id: "fav-50", category: "favorites", metric: "favorites", threshold: 50, emoji: "💖", title: "Half Her Heart", description: "Mark 50 favorites" },
  { id: "fav-75", category: "favorites", metric: "favorites", threshold: 75, emoji: "💖", title: "Favorite-Prone", description: "Mark 75 favorites" },
  { id: "fav-100", category: "favorites", metric: "favorites", threshold: 100, emoji: "💝", title: "100 Favorites", description: "Mark 100 favorites" },

  // Artists
  { id: "artists-50", category: "artists", metric: "artists", threshold: 50, emoji: "🎤", title: "50 Voices", description: "50 different artists" },
  { id: "artists-100", category: "artists", metric: "artists", threshold: 100, emoji: "🎤", title: "100 Artists", description: "100 different artists" },
  { id: "artists-150", category: "artists", metric: "artists", threshold: 150, emoji: "🎙️", title: "150 Artists", description: "150 different artists" },
  { id: "artists-200", category: "artists", metric: "artists", threshold: 200, emoji: "🎙️", title: "200 Artists", description: "200 different artists" },
  { id: "artists-250", category: "artists", metric: "artists", threshold: 250, emoji: "🌐", title: "250 Artists", description: "250 different artists" },

  // Genres
  { id: "genres-25", category: "genres", metric: "genres", threshold: 25, emoji: "🎼", title: "Genre Explorer", description: "25 different genres" },
  { id: "genres-50", category: "genres", metric: "genres", threshold: 50, emoji: "🎼", title: "50 Genres", description: "50 different genres" },
  { id: "genres-100", category: "genres", metric: "genres", threshold: 100, emoji: "🧭", title: "Genre-Bending", description: "100 different genres" },
  { id: "genres-150", category: "genres", metric: "genres", threshold: 150, emoji: "🧭", title: "150 Genres", description: "150 different genres" },
  { id: "genres-200", category: "genres", metric: "genres", threshold: 200, emoji: "🗺️", title: "All Over the Map", description: "200 different genres" },

  // Discogs linked
  { id: "linked-25", category: "discogsLinked", metric: "discogsLinked", threshold: 25, emoji: "🔗", title: "First Links", description: "25 records linked to Discogs" },
  { id: "linked-50", category: "discogsLinked", metric: "discogsLinked", threshold: 50, emoji: "🔗", title: "50 Linked", description: "50 records linked to Discogs" },
  { id: "linked-100", category: "discogsLinked", metric: "discogsLinked", threshold: 100, emoji: "🔗", title: "100 Linked", description: "100 records linked to Discogs" },
  { id: "linked-150", category: "discogsLinked", metric: "discogsLinked", threshold: 150, emoji: "🔗", title: "150 Linked", description: "150 records linked to Discogs" },
  { id: "linked-200", category: "discogsLinked", metric: "discogsLinked", threshold: 200, emoji: "🔗", title: "200 Linked", description: "200 records linked to Discogs" },

  // Discogs verified
  { id: "verified-10", category: "discogsVerified", metric: "discogsVerified", threshold: 10, emoji: "✅", title: "First Confirmations", description: "10 pressings confirmed" },
  { id: "verified-25", category: "discogsVerified", metric: "discogsVerified", threshold: 25, emoji: "✅", title: "25 Confirmed", description: "25 pressings confirmed" },
  { id: "verified-50", category: "discogsVerified", metric: "discogsVerified", threshold: 50, emoji: "✅", title: "50 Confirmed", description: "50 pressings confirmed" },
  { id: "verified-100", category: "discogsVerified", metric: "discogsVerified", threshold: 100, emoji: "🏅", title: "100 Confirmed", description: "100 pressings confirmed" },

  // Collection value
  { id: "value-500", category: "value", metric: "collectionValue", threshold: 500, emoji: "💵", title: "$500 Collection", description: "Estimated value passes $500" },
  { id: "value-1000", category: "value", metric: "collectionValue", threshold: 1000, emoji: "💰", title: "Four Figures", description: "Estimated value passes $1,000" },
  { id: "value-2500", category: "value", metric: "collectionValue", threshold: 2500, emoji: "💰", title: "$2,500 Collection", description: "Estimated value passes $2,500" },
  { id: "value-5000", category: "value", metric: "collectionValue", threshold: 5000, emoji: "🏦", title: "$5,000 Collection", description: "Estimated value passes $5,000" },
  { id: "value-10000", category: "value", metric: "collectionValue", threshold: 10000, emoji: "💎", title: "Five Figures", description: "Estimated value passes $10,000" },
];

export type AchievementStats = Partial<Record<AchievementMetric, number>>;

export function computeInstantStats(records: VinylRecord[]): AchievementStats {
  return {
    owned: records.filter((record) => record.status === "owned").length,
    favorites: records.filter((record) => record.favorite).length,
    artists: new Set(records.map((record) => record.artist)).size,
    genres: new Set(records.flatMap((record) => record.genres)).size,
    discogsLinked: records.filter((record) => record.discogsReleaseId).length,
    discogsVerified: records.filter((record) => record.discogsVerified).length,
  };
}

export function getUnlockedAchievements(stats: AchievementStats): Achievement[] {
  return ACHIEVEMENTS.filter((achievement) => {
    const current = stats[achievement.metric];
    return typeof current === "number" && current >= achievement.threshold;
  });
}
