import type { Country, TravelState } from "@/lib/travel";

export interface TravelMapCenter {
  latitude: number;
  longitude: number;
  zoom: number;
  label: string;
}

const COUNTRY_CENTERS: Record<string, Omit<TravelMapCenter, "label">> = {
  Australia: { latitude: -25.3, longitude: 133.8, zoom: 4 },
  Austria: { latitude: 47.6, longitude: 14.1, zoom: 7 },
  Bahamas: { latitude: 24.2, longitude: -76.4, zoom: 7 },
  Belgium: { latitude: 50.6, longitude: 4.7, zoom: 8 },
  "British Virgin Islands": { latitude: 18.42, longitude: -64.64, zoom: 10 },
  Cuba: { latitude: 21.5, longitude: -79.4, zoom: 6 },
  "Czech Republic": { latitude: 49.8, longitude: 15.5, zoom: 7 },
  "Dominican Republic": { latitude: 18.9, longitude: -70.2, zoom: 7 },
  England: { latitude: 52.4, longitude: -1.5, zoom: 6 },
  France: { latitude: 46.7, longitude: 2.2, zoom: 6 },
  Germany: { latitude: 51.2, longitude: 10.4, zoom: 6 },
  Iceland: { latitude: 64.9, longitude: -18.6, zoom: 6 },
  Italy: { latitude: 42.8, longitude: 12.6, zoom: 6 },
  Japan: { latitude: 37.5, longitude: 138.3, zoom: 5 },
  Luxembourg: { latitude: 49.8, longitude: 6.1, zoom: 9 },
  Mexico: { latitude: 23.6, longitude: -102.5, zoom: 5 },
  Netherlands: { latitude: 52.2, longitude: 5.3, zoom: 7 },
  Peru: { latitude: -9.2, longitude: -75, zoom: 5 },
  Scotland: { latitude: 56.8, longitude: -4.2, zoom: 6 },
  Spain: { latitude: 40.3, longitude: -3.7, zoom: 6 },
  Switzerland: { latitude: 46.8, longitude: 8.2, zoom: 7 },
  Thailand: { latitude: 15.9, longitude: 101, zoom: 5 },
  "United States Virgin Islands": { latitude: 18.34, longitude: -64.9, zoom: 10 },
  "Vatican City": { latitude: 41.9, longitude: 12.45, zoom: 14 },
};

const STATE_CENTERS: Record<string, Omit<TravelMapCenter, "label">> = {
  Alabama: { latitude: 32.8, longitude: -86.8, zoom: 7 },
  Alaska: { latitude: 64.2, longitude: -152.4, zoom: 4 },
  Arizona: { latitude: 34.2, longitude: -111.6, zoom: 6 },
  Arkansas: { latitude: 34.8, longitude: -92.4, zoom: 7 },
  California: { latitude: 36.8, longitude: -119.7, zoom: 6 },
  Colorado: { latitude: 39, longitude: -105.5, zoom: 7 },
  Connecticut: { latitude: 41.6, longitude: -72.7, zoom: 8 },
  Delaware: { latitude: 39, longitude: -75.5, zoom: 8 },
  Florida: { latitude: 27.8, longitude: -81.7, zoom: 6 },
  Georgia: { latitude: 32.6, longitude: -83.5, zoom: 7 },
  Hawaii: { latitude: 20.8, longitude: -157.5, zoom: 7 },
  Idaho: { latitude: 44.1, longitude: -114.6, zoom: 6 },
  Illinois: { latitude: 40, longitude: -89.2, zoom: 7 },
  Indiana: { latitude: 40, longitude: -86.1, zoom: 7 },
  Iowa: { latitude: 42.1, longitude: -93.5, zoom: 7 },
  Kansas: { latitude: 38.5, longitude: -98.4, zoom: 7 },
  Kentucky: { latitude: 37.8, longitude: -85.3, zoom: 7 },
  Louisiana: { latitude: 31.1, longitude: -91.9, zoom: 7 },
  Maine: { latitude: 45.3, longitude: -69, zoom: 7 },
  Maryland: { latitude: 39, longitude: -76.7, zoom: 8 },
  Massachusetts: { latitude: 42.3, longitude: -71.8, zoom: 8 },
  Michigan: { latitude: 44.3, longitude: -85.6, zoom: 6 },
  Minnesota: { latitude: 46.3, longitude: -94.3, zoom: 6 },
  Mississippi: { latitude: 32.7, longitude: -89.7, zoom: 7 },
  Missouri: { latitude: 38.5, longitude: -92.6, zoom: 7 },
  Montana: { latitude: 47, longitude: -110.4, zoom: 6 },
  Nebraska: { latitude: 41.5, longitude: -99.8, zoom: 7 },
  Nevada: { latitude: 39.3, longitude: -116.6, zoom: 6 },
  "New Hampshire": { latitude: 43.7, longitude: -71.6, zoom: 8 },
  "New Jersey": { latitude: 40.1, longitude: -74.5, zoom: 8 },
  "New Mexico": { latitude: 34.4, longitude: -106.1, zoom: 6 },
  "New York": { latitude: 42.9, longitude: -75.5, zoom: 7 },
  "North Carolina": { latitude: 35.5, longitude: -79, zoom: 7 },
  "North Dakota": { latitude: 47.5, longitude: -100.5, zoom: 7 },
  Ohio: { latitude: 40.3, longitude: -82.8, zoom: 7 },
  Oklahoma: { latitude: 35.6, longitude: -97.5, zoom: 7 },
  Oregon: { latitude: 44, longitude: -120.6, zoom: 6 },
  Pennsylvania: { latitude: 41, longitude: -77.7, zoom: 7 },
  "Rhode Island": { latitude: 41.7, longitude: -71.5, zoom: 9 },
  "South Carolina": { latitude: 33.8, longitude: -80.9, zoom: 7 },
  "South Dakota": { latitude: 44.4, longitude: -100.2, zoom: 7 },
  Tennessee: { latitude: 35.8, longitude: -86.4, zoom: 7 },
  Texas: { latitude: 31, longitude: -99.3, zoom: 6 },
  Utah: { latitude: 39.3, longitude: -111.7, zoom: 7 },
  Vermont: { latitude: 44, longitude: -72.7, zoom: 8 },
  Virginia: { latitude: 37.5, longitude: -78.6, zoom: 7 },
  Washington: { latitude: 47.4, longitude: -120.7, zoom: 7 },
  "West Virginia": { latitude: 38.6, longitude: -80.6, zoom: 7 },
  Wisconsin: { latitude: 44.6, longitude: -89.8, zoom: 7 },
  Wyoming: { latitude: 43, longitude: -107.5, zoom: 6 },
};

export function countryMapCenter(country: Pick<Country, "display_name">): TravelMapCenter {
  const center = COUNTRY_CENTERS[country.display_name] ?? { latitude: 20, longitude: 0, zoom: 2 };
  return { ...center, label: country.display_name };
}

export function stateMapCenter(state: Pick<TravelState, "state_name">): TravelMapCenter {
  const center = STATE_CENTERS[state.state_name] ?? { latitude: 39.8, longitude: -98.6, zoom: 4 };
  return { ...center, label: state.state_name };
}
