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
  trip_id: string | null;
  image_url: string;
  caption: string | null;
  location_name: string | null;
  taken_on: string | null;
  sort_order: number;
}

export type TravelFavoriteType = 'restaurant' | 'activity' | 'place';

export interface TravelFavorite {
  id: string;
  country_id: string;
  trip_id: string | null;
  type: TravelFavoriteType;
  name: string;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
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

export function countrySlug(country: Pick<Country, 'display_name'>) {
  return country.display_name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function findCountryBySlug(countries: Country[], slug: string) {
  return countries.find((country) => countrySlug(country) === slug) ?? null;
}

export function travelerLabel(country: Pick<Country, 'baylor_visited' | 'isabel_visited'>) {
  if (country.baylor_visited && country.isabel_visited) return 'Baylor and Isabel';
  if (country.baylor_visited) return 'Baylor';
  return 'Isabel';
}
