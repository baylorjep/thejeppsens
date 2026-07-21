export interface Country {
  id: string;
  geo_name: string;
  display_name: string;
  flag: string;
  continent: string;
  baylor_visited: boolean;
  isabel_visited: boolean;
}

export interface TravelTrip {
  id: string;
  country_id: string;
  state_id: string | null;
  title: string;
  location_name: string | null;
  started_on: string | null;
  ended_on: string | null;
  notes: string | null;
  baylor_went: boolean;
  isabel_went: boolean;
}

export interface TravelPhoto {
  id: string;
  country_id: string;
  state_id: string | null;
  trip_id: string | null;
  favorite_id: string | null;
  image_url: string;
  caption: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  taken_on: string | null;
  sort_order: number;
  is_featured?: boolean;
  is_favorite_featured?: boolean;
  created_at?: string | null;
}

export type TravelFavoriteType = 'restaurant' | 'activity' | 'place';

export interface TravelFavorite {
  id: string;
  country_id: string;
  state_id: string | null;
  trip_id: string | null;
  type: TravelFavoriteType;
  name: string;
  location_name: string | null;
  address: string | null;
  cuisine: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  sort_order: number;
}

export function travelFavoriteMapsUrl(favorite: Pick<TravelFavorite, 'name' | 'location_name' | 'address' | 'latitude' | 'longitude'>) {
  const query = favorite.address?.trim()
    || (favorite.latitude !== null && favorite.longitude !== null ? `${favorite.latitude},${favorite.longitude}` : "")
    || [favorite.name, favorite.location_name].filter(Boolean).join(", ");

  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : null;
}

export interface TravelVideo {
  id: string;
  country_id: string;
  state_id: string | null;
  trip_id: string | null;
  title: string;
  url: string;
  provider: string;
  thumbnail_url: string | null;
  visibility: 'unlisted' | 'public' | 'private' | 'unknown';
  notes: string | null;
  sort_order: number;
}

export interface TravelState {
  id: string;
  state_name: string;
  abbreviation: string;
  baylor_visited: boolean;
  isabel_visited: boolean;
}

export interface TravelStatePhotoPreview {
  state_id: string;
  state_name: string;
  image_url: string;
  caption: string | null;
  location_name: string | null;
  photo_count: number;
}

export function countrySlug(country: Pick<Country, 'display_name'>) {
  return country.display_name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function stateSlug(state: Pick<TravelState, 'state_name'>) {
  return state.state_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function findStateBySlug(states: TravelState[], slug: string) {
  return states.find((state) => stateSlug(state) === slug) ?? null;
}

export function findCountryBySlug(countries: Country[], slug: string) {
  return countries.find((country) => countrySlug(country) === slug) ?? null;
}

export function travelerLabel(country: Pick<Country, 'baylor_visited' | 'isabel_visited'>) {
  if (country.baylor_visited && country.isabel_visited) return 'Baylor and Isabel';
  if (country.baylor_visited) return 'Baylor';
  return 'Isabel';
}

export function youtubeEmbedUrl(url: string) {
  const id = youtubeVideoId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

export function youtubeVideoId(url: string) {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/shorts\/([^?]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
  ];
  return patterns.map((pattern) => url.match(pattern)?.[1]).find(Boolean) ?? null;
}

export function youtubeThumbnailUrl(url: string) {
  const id = youtubeVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}
