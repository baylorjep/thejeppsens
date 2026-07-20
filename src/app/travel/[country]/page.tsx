import Header from '@/components/Header';
import TravelDataNudges from '@/components/TravelDataNudges';
import TravelEditButton from '@/components/TravelEditButton';
import TravelCountryEditor from '@/components/TravelCountryEditor';
import TravelFavoriteChips from '@/components/TravelFavoriteChips';
import TravelFavoriteMap from '@/components/TravelFavoriteMap';
import TravelPhotoLog from '@/components/TravelPhotoLog';
import TravelQuickAddButton from '@/components/TravelQuickAddButton';
import TravelVideoEmbed from '@/components/TravelVideoEmbed';
import USStatesTracker from '@/components/USStatesTracker';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { countryMapCenter } from '@/lib/travelMapCenters';
import {
  countrySlug,
  findCountryBySlug,
  travelerLabel,
  type Country,
  type TravelFavorite,
  type TravelPhoto,
  type TravelState,
  type TravelStatePhotoPreview,
  type TravelTrip,
  type TravelVideo,
} from '@/lib/travel';
import { ArrowLeft, CalendarDays, MapPinned, Sparkles, Utensils } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ country: string }>;
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

export default async function CountryTravelPage({ params }: PageProps) {
  const { country: slug } = await params;
  const supabase = getSupabaseServerClient();
  if (!supabase) notFound();

  const { data: countries, error: countryError } = await supabase
    .from('visited_countries')
    .select('id, geo_name, display_name, flag, continent, baylor_visited, isabel_visited')
    .order('display_name');

  if (countryError || !countries) notFound();

  const country = findCountryBySlug(countries as Country[], slug);
  if (!country) notFound();

  const [{ data: trips }, { data: photos }, { data: favorites }, { data: videos }] = await Promise.all([
    supabase
      .from('travel_trips')
      .select('id, country_id, state_id, title, location_name, started_on, ended_on, notes, baylor_went, isabel_went')
      .eq('country_id', country.id)
      .is('state_id', null)
      .order('started_on', { ascending: false, nullsFirst: false }),
    supabase
      .from('travel_photos')
      .select('id, country_id, state_id, trip_id, favorite_id, image_url, caption, location_name, latitude, longitude, taken_on, sort_order, is_featured, is_favorite_featured, created_at')
      .eq('country_id', country.id)
      .is('state_id', null)
      .order('is_featured', { ascending: false })
      .order('taken_on', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .order('sort_order'),
    supabase
      .from('travel_favorites')
      .select('id, country_id, state_id, trip_id, type, name, location_name, latitude, longitude, notes, sort_order')
      .eq('country_id', country.id)
      .is('state_id', null)
      .order('sort_order')
      .order('name'),
    supabase
      .from('travel_videos')
      .select('id, country_id, state_id, trip_id, title, url, provider, thumbnail_url, visibility, notes, sort_order')
      .eq('country_id', country.id)
      .is('state_id', null)
      .order('sort_order')
      .order('created_at', { ascending: false }),
  ]);

  const tripRows = (trips ?? []) as TravelTrip[];
  const photoRows = (photos ?? []) as TravelPhoto[];
  const favoriteRows = (favorites ?? []) as TravelFavorite[];
  const videoRows = (videos ?? []) as TravelVideo[];
  const restaurants = favoriteRows.filter((favorite) => favorite.type === 'restaurant');
  const activities = favoriteRows.filter((favorite) => favorite.type !== 'restaurant');
  const isUnitedStates = countrySlug(country) === 'united-states';
  const [{ data: states }, { data: statePhotos }] = isUnitedStates
    ? await Promise.all([
        supabase
          .from('visited_states')
          .select('id, state_name, abbreviation, baylor_visited, isabel_visited')
          .order('state_name'),
        supabase
          .from('travel_photos')
          .select('id, country_id, state_id, trip_id, favorite_id, image_url, caption, location_name, latitude, longitude, taken_on, sort_order, is_featured, is_favorite_featured, created_at')
          .eq('country_id', country.id)
          .not('state_id', 'is', null)
          .order('is_featured', { ascending: false })
          .order('taken_on', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .order('sort_order'),
      ])
    : [{ data: null }, { data: null }];
  const stateRows = (states ?? []) as TravelState[];
  const stateById = new Map(stateRows.map((state) => [state.id, state]));
  const statePhotoCounts = ((statePhotos ?? []) as TravelPhoto[]).reduce<Record<string, number>>((acc, photo) => {
    if (photo.state_id) acc[photo.state_id] = (acc[photo.state_id] ?? 0) + 1;
    return acc;
  }, {});
  const statePhotoPreviews = ((statePhotos ?? []) as TravelPhoto[]).reduce<TravelStatePhotoPreview[]>((acc, photo) => {
    if (!photo.state_id || acc.some((preview) => preview.state_id === photo.state_id)) return acc;
    const state = stateById.get(photo.state_id);
    if (!state) return acc;
    acc.push({
      state_id: state.id,
      state_name: state.state_name,
      image_url: photo.image_url,
      caption: photo.caption,
      location_name: photo.location_name,
      photo_count: statePhotoCounts[state.id] ?? 1,
    });
    return acc;
  }, []);
  const heroPhoto = photoRows[0];
  const mapCenter = countryMapCenter(country);
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
            href="/travel"
            className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Travel
          </Link>

          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-5 flex items-center gap-4">
                <span className="text-5xl leading-none">{country.flag}</span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-teal-300">{country.continent}</p>
                  <h1 className="mt-1 text-5xl font-bold tracking-tight sm:text-6xl">{country.display_name}</h1>
                </div>
              </div>
              <p className="max-w-2xl text-base leading-7 text-slate-300">
                {travelerLabel(country)} visited. {countLabel(tripRows.length, 'trip')} logged, {countLabel(photoRows.length, 'photo')} saved,{' '}
                {countLabel(favoriteRows.length, 'favorite spot')}.
              </p>
            </div>
          </div>
        </div>
      </section>

      <TravelDataNudges photos={photoRows} favorites={favoriteRows} trips={tripRows} videos={videoRows} />

      {isUnitedStates && <USStatesTracker states={stateRows} photoPreviews={statePhotoPreviews} showHeading={false} />}

      {!isUnitedStates && (
        <>
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

            <TravelPhotoLog photos={photoRows} favorites={favoriteRows} fallbackName={country.display_name} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Favorite Map</h2>
                <p className="text-sm text-slate-500">Restaurants, activities, and memorable places.</p>
              </div>
              <TravelQuickAddButton kind="favorite" />
            </div>

            <TravelFavoriteMap favorites={favoriteRows} photos={photoRows} fallbackCenter={mapCenter} />
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div className="lg:col-span-2">
            <div className="mb-5 flex items-center gap-3">
              <TravelQuickAddButton kind="trip" />
              <h2 className="text-lg font-bold text-slate-950">Trips</h2>
            </div>

            {tripRows.length > 0 ? (
              <div className="space-y-4">
                {tripRows.map((trip) => (
                  <article key={trip.id} className="rounded-xl border border-slate-200 bg-white p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{trip.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">{trip.location_name ?? country.display_name}</p>
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
                    {(trip.notes || photosByTrip.get(trip.id)?.length || favoritesByTrip.get(trip.id)?.length || videosByTrip.get(trip.id)?.length) && (
                      <details className="mt-4 group">
                        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-500 transition-colors hover:text-slate-950">
                          Details
                        </summary>
                        {trip.notes && <p className="mt-3 text-sm leading-6 text-slate-600">{trip.notes}</p>}
                        {(photosByTrip.get(trip.id)?.length || favoritesByTrip.get(trip.id)?.length || videosByTrip.get(trip.id)?.length) && (
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {(photosByTrip.get(trip.id) ?? []).slice(0, 2).map((photo) => (
                              <div key={photo.id} className="overflow-hidden rounded-lg bg-slate-50">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={photo.image_url} alt={photo.caption ?? trip.title} className="h-28 w-full object-cover" />
                              </div>
                            ))}
                            {(favoritesByTrip.get(trip.id) ?? []).slice(0, 3).map((favorite) => (
                              <div key={favorite.id} className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                                <MapPinned className="h-4 w-4 text-teal-600" />
                                <span>{favorite.name}</span>
                              </div>
                            ))}
                            {(videosByTrip.get(trip.id) ?? []).map((video) => (
                              <TravelVideoEmbed key={video.id} video={video} />
                            ))}
                          </div>
                        )}
                      </details>
                    )}
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

          <aside className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center gap-3">
                <TravelQuickAddButton kind="restaurant" />
                <h2 className="text-lg font-bold text-slate-950">Restaurants</h2>
              </div>
              {restaurants.length > 0 ? (
                <TravelFavoriteChips favorites={restaurants} photos={photoRows} />
              ) : (
                <div className="flex flex-col items-start gap-3">
                  <Utensils className="h-6 w-6 text-slate-300" />
                  <p className="text-sm text-slate-400">No restaurants yet.</p>
                  <TravelQuickAddButton kind="restaurant" label="Add first restaurant" />
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center gap-3">
                <TravelQuickAddButton kind="activity" />
                <h2 className="text-lg font-bold text-slate-950">Activities</h2>
              </div>
              {activities.length > 0 ? (
                <TravelFavoriteChips favorites={activities} photos={photoRows} />
              ) : (
                <div className="flex flex-col items-start gap-3">
                  <Sparkles className="h-6 w-6 text-slate-300" />
                  <p className="text-sm text-slate-400">No activities yet.</p>
                  <TravelQuickAddButton kind="activity" label="Add first activity" />
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>
      <TravelCountryEditor country={country} trips={tripRows} photos={photoRows} favorites={favoriteRows} videos={videoRows} />
        </>
      )}
    </main>
  );
}
