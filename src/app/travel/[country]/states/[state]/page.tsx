import Header from '@/components/Header';
import TravelDataNudges from '@/components/TravelDataNudges';
import TravelEditButton from '@/components/TravelEditButton';
import TravelCountryEditor from '@/components/TravelCountryEditor';
import TravelFavoriteChips from '@/components/TravelFavoriteChips';
import TravelFavoriteMap from '@/components/TravelFavoriteMap';
import TravelPhotoLog from '@/components/TravelPhotoLog';
import TravelQuickAddButton from '@/components/TravelQuickAddButton';
import TravelVideoEmbed from '@/components/TravelVideoEmbed';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { stateMapCenter } from '@/lib/travelMapCenters';
import {
  findStateBySlug,
  travelerLabel,
  type Country,
  type TravelFavorite,
  type TravelFavoriteLocation,
  type TravelPhoto,
  type TravelState,
  type TravelTrip,
  type TravelVideo,
} from '@/lib/travel';
import { ArrowLeft, CalendarDays, MapPinned, Sparkles, Utensils } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ country: string; state: string }>;
}

function formatDateRange(trip: TravelTrip) {
  if (!trip.started_on && !trip.ended_on) return null;
  const format = (date: string) =>
    new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
  if (trip.started_on && trip.ended_on && trip.started_on !== trip.ended_on) {
    return `${format(trip.started_on)} - ${format(trip.ended_on)}`;
  }
  return format(trip.started_on ?? trip.ended_on ?? '');
}

function countLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export default async function StateTravelPage({ params }: PageProps) {
  const { country, state: stateParam } = await params;
  if (country !== 'united-states') notFound();

  const supabase = getSupabaseServerClient();
  if (!supabase) notFound();

  const [{ data: countryRows }, { data: states }] = await Promise.all([
    supabase
      .from('visited_countries')
      .select('id, geo_name, display_name, flag, continent, baylor_visited, isabel_visited')
      .eq('geo_name', 'United States of America')
      .single(),
    supabase
      .from('visited_states')
      .select('id, state_name, abbreviation, baylor_visited, isabel_visited')
      .order('state_name'),
  ]);

  const unitedStates = countryRows as Country | null;
  const state = findStateBySlug((states ?? []) as TravelState[], stateParam);
  if (!unitedStates || !state) notFound();

  const [{ data: trips }, { data: photos }, { data: favorites }, { data: favoriteLocations }, { data: videos }] = await Promise.all([
    supabase
      .from('travel_trips')
      .select('id, country_id, state_id, title, location_name, started_on, ended_on, notes, baylor_went, isabel_went')
      .eq('country_id', unitedStates.id)
      .eq('state_id', state.id)
      .order('started_on', { ascending: false, nullsFirst: false }),
    supabase
      .from('travel_photos')
      .select('id, country_id, state_id, trip_id, favorite_id, favorite_location_id, image_url, image_hash, caption, location_name, latitude, longitude, taken_on, sort_order, is_featured, is_favorite_featured, created_at')
      .eq('country_id', unitedStates.id)
      .eq('state_id', state.id)
      .order('is_featured', { ascending: false })
      .order('taken_on', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .order('sort_order'),
    supabase
      .from('travel_favorites')
      .select('id, country_id, state_id, trip_id, type, name, location_name, address, cuisine, latitude, longitude, notes, sort_order')
      .eq('country_id', unitedStates.id)
      .eq('state_id', state.id)
      .order('sort_order')
      .order('name'),
    supabase
      .from('travel_favorite_locations')
      .select('id, favorite_id, country_id, state_id, name, location_name, address, latitude, longitude, notes, sort_order')
      .eq('country_id', unitedStates.id)
      .eq('state_id', state.id)
      .order('sort_order')
      .order('name'),
    supabase
      .from('travel_videos')
      .select('id, country_id, state_id, trip_id, title, url, provider, thumbnail_url, visibility, notes, sort_order')
      .eq('country_id', unitedStates.id)
      .eq('state_id', state.id)
      .order('sort_order')
      .order('created_at', { ascending: false }),
  ]);

  const tripRows = (trips ?? []) as TravelTrip[];
  const photoRows = (photos ?? []) as TravelPhoto[];
  const favoriteLocationRows = (favoriteLocations ?? []) as TravelFavoriteLocation[];
  const favoriteRows = ((favorites ?? []) as TravelFavorite[]).map((favorite) => ({
    ...favorite,
    locations: favoriteLocationRows.filter((location) => location.favorite_id === favorite.id),
  }));
  const videoRows = (videos ?? []) as TravelVideo[];
  const restaurants = favoriteRows.filter((favorite) => favorite.type === 'restaurant');
  const activities = favoriteRows.filter((favorite) => favorite.type !== 'restaurant');
  const heroPhoto = photoRows[0];
  const mapCenter = stateMapCenter(state);
  const photosByTrip = new Map<string, TravelPhoto[]>();
  photoRows.forEach((photo) => {
    if (!photo.trip_id) return;
    photosByTrip.set(photo.trip_id, [...(photosByTrip.get(photo.trip_id) ?? []), photo]);
  });
  const favoritesByTrip = new Map<string, TravelFavorite[]>();
  favoriteRows.forEach((favorite) => {
    if (!favorite.trip_id) return;
    favoritesByTrip.set(favorite.trip_id, [...(favoritesByTrip.get(favorite.trip_id) ?? []), favorite]);
  });
  const videosByTrip = new Map<string, TravelVideo[]>();
  videoRows.forEach((video) => {
    if (!video.trip_id) return;
    videosByTrip.set(video.trip_id, [...(videosByTrip.get(video.trip_id) ?? []), video]);
  });

  return (
    <main className="min-h-screen bg-white">
      <Header />

      <section className="relative overflow-hidden border-b border-slate-100 bg-slate-950 text-white">
        {heroPhoto && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroPhoto.image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />
            <div className="absolute inset-0 bg-slate-950/70" />
          </>
        )}
        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <Link
            href="/travel/united-states"
            className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            United States
          </Link>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-300">United States</p>
            <h1 className="mt-2 text-5xl font-bold tracking-tight sm:text-6xl">{state.state_name}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
              {travelerLabel({ baylor_visited: state.baylor_visited, isabel_visited: state.isabel_visited })} visited.{' '}
              {countLabel(tripRows.length, 'trip')}, {countLabel(photoRows.length, 'photo')}, {countLabel(favoriteRows.length, 'favorite spot')}.
            </p>
          </div>
        </div>
      </section>

      <TravelDataNudges photos={photoRows} favorites={favoriteRows} trips={tripRows} videos={videoRows} />

      <section className="bg-slate-50 py-12">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Photo Log</h2>
                <p className="text-sm text-slate-500">Saved moments by place and trip.</p>
              </div>
              <TravelQuickAddButton kind="photo" />
            </div>

            <TravelPhotoLog photos={photoRows} favorites={favoriteRows} fallbackName={state.state_name} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Favorite Map</h2>
                <p className="text-sm text-slate-500">Food, activities, and memorable places.</p>
              </div>
              <TravelQuickAddButton kind="favorite" />
            </div>

            <TravelFavoriteMap favorites={favoriteRows} photos={photoRows} fallbackCenter={mapCenter} />
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6 lg:px-8">
          <div>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-950">Trip Overview</h2>
                <p className="text-sm text-slate-500">Travel plans, memories, and what they include.</p>
              </div>
              <TravelQuickAddButton kind="trip" />
            </div>

            {tripRows.length > 0 ? (
              <div className="space-y-4">
                {tripRows.map((trip) => (
                  <article key={trip.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
                      <div className="p-5 sm:p-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-slate-950">{trip.title}</h3>
                            <p className="mt-1 text-sm text-slate-500">{trip.location_name ?? state.state_name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {formatDateRange(trip) && (
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                                {formatDateRange(trip)}
                              </span>
                            )}
                            <TravelEditButton type="trip" item={trip} label={`Edit ${trip.title}`} />
                          </div>
                        </div>
                        <div className="mt-5 grid grid-cols-3 gap-3">
                          <div className="rounded-lg bg-slate-50 p-3">
                            <p className="text-lg font-bold text-slate-950">{photosByTrip.get(trip.id)?.length ?? 0}</p>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Photos</p>
                          </div>
                          <div className="rounded-lg bg-slate-50 p-3">
                            <p className="text-lg font-bold text-slate-950">{favoritesByTrip.get(trip.id)?.length ?? 0}</p>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Favorites</p>
                          </div>
                          <div className="rounded-lg bg-slate-50 p-3">
                            <p className="text-lg font-bold text-slate-950">{videosByTrip.get(trip.id)?.length ?? 0}</p>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Videos</p>
                          </div>
                        </div>
                        {trip.notes && <p className="mt-5 text-sm leading-6 text-slate-600">{trip.notes}</p>}
                      </div>
                      <div className="border-t border-slate-100 bg-slate-50 p-4 lg:border-l lg:border-t-0">
                        {(photosByTrip.get(trip.id)?.length || favoritesByTrip.get(trip.id)?.length || videosByTrip.get(trip.id)?.length) ? (
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                            {(photosByTrip.get(trip.id) ?? []).slice(0, 4).map((photo) => (
                              <div key={photo.id} className="overflow-hidden rounded-lg bg-white">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={photo.image_url} alt={photo.caption ?? trip.title} className="h-28 w-full object-cover" />
                              </div>
                            ))}
                            {(favoritesByTrip.get(trip.id) ?? []).slice(0, 4).map((favorite) => (
                              <div key={favorite.id} className="flex items-center gap-2 rounded-lg bg-white p-3 text-sm text-slate-600">
                                <MapPinned className="h-4 w-4 text-teal-600" />
                                <span>{favorite.name}</span>
                              </div>
                            ))}
                            {(videosByTrip.get(trip.id) ?? []).map((video) => (
                              <TravelVideoEmbed key={video.id} video={video} />
                            ))}
                          </div>
                        ) : (
                          <div className="flex h-full min-h-36 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white text-sm text-slate-400">
                            No photos, favorites, or videos attached yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                <CalendarDays className="h-7 w-7 text-slate-300" />
                <p className="text-sm text-slate-400">No trips logged yet.</p>
                <TravelQuickAddButton kind="trip" label="Add first trip" />
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-950">Favorite Spots</h2>
                <p className="text-sm text-slate-500">Food, activities, and places worth remembering.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <TravelQuickAddButton kind="restaurant" />
                <TravelQuickAddButton kind="activity" />
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-rose-600" />
                  <h3 className="text-base font-bold text-slate-950">Food</h3>
                </div>
                {restaurants.length > 0 ? (
                  <TravelFavoriteChips favorites={restaurants} photos={photoRows} />
                ) : (
                  <p className="text-sm text-slate-400">No food spots yet.</p>
                )}
              </div>
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  <h3 className="text-base font-bold text-slate-950">Activities & Places</h3>
                </div>
                {activities.length > 0 ? (
                  <TravelFavoriteChips favorites={activities} photos={photoRows} />
                ) : (
                  <p className="text-sm text-slate-400">No activities yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-100 bg-white py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <details className="rounded-xl border border-slate-200 bg-slate-50">
            <summary className="cursor-pointer px-5 py-4 text-sm font-bold text-slate-700">Edit Travel Log</summary>
            <TravelCountryEditor country={unitedStates} state={state} mapCenter={mapCenter} trips={tripRows} photos={photoRows} favorites={favoriteRows} videos={videoRows} />
          </details>
        </div>
      </section>
    </main>
  );
}
