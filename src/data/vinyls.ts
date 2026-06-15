export type VinylRecord = {
  id: string;
  title: string;
  artist: string;
  releaseYear?: number;
  label?: string;
  catalogNumber?: string;
  format?: string;
  discCount?: number;
  genres: string[];
  moods: string[];
  favoriteTracks?: string[];
  pressing?: string;
  vinylColor?: string;
  condition?: string;
  source?: string;
  dateAdded?: string;
  status: "owned" | "wishlist" | "upgrade";
  notes?: string;
  favoriteStories?: string;
  coverImage?: string;
  backCoverImage?: string;
  favorite?: boolean;
};

export const vinyls: VinylRecord[] = [
  {
    id: "rumours",
    title: "Rumours",
    artist: "Fleetwood Mac",
    releaseYear: 1977,
    genres: ["Rock", "Pop Rock"],
    moods: ["Classic", "Dinner", "Road trip"],
    favoriteTracks: ["Dreams", "The Chain"],
    pressing: "Example entry",
    vinylColor: "Black",
    condition: "Good",
    source: "Gift idea",
    status: "owned",
    notes: "Replace this with one of Isabel's records.",
    favoriteStories: "Add a memory about when she got it, where it played, or why it matters.",
    favorite: true,
  },
  {
    id: "blue",
    title: "Blue",
    artist: "Joni Mitchell",
    releaseYear: 1971,
    genres: ["Folk", "Singer-songwriter"],
    moods: ["Quiet", "Sunday", "Sad girl"],
    favoriteTracks: ["A Case of You"],
    pressing: "Example entry",
    vinylColor: "Black",
    condition: "Unknown",
    source: "Example",
    status: "wishlist",
    notes: "Add a cover image later or leave coverImage blank.",
    favoriteStories: "This can hold the story behind wanting this record.",
  },
  {
    id: "golden-hour",
    title: "Golden Hour",
    artist: "Kacey Musgraves",
    releaseYear: 2018,
    genres: ["Country", "Pop"],
    moods: ["Sunny", "Cooking", "Cozy"],
    favoriteTracks: ["Slow Burn", "Rainbow"],
    pressing: "Example entry",
    vinylColor: "Clear",
    condition: "New",
    source: "Record store",
    status: "owned",
    notes: "Use this as a template for modern records and color variants.",
    favorite: true,
  },
  {
    id: "folklore",
    title: "Folklore",
    artist: "Taylor Swift",
    releaseYear: 2020,
    genres: ["Indie Folk", "Pop"],
    moods: ["Rainy", "Quiet", "Reading"],
    favoriteTracks: ["Cardigan", "August"],
    pressing: "Example entry",
    vinylColor: "Beige",
    condition: "Good",
    source: "Wishlist",
    status: "upgrade",
    notes: "Mark upgrade when she owns one but might want a better pressing.",
  },
];
