import Header from '@/components/Header';
import TravelCountryEditor from '@/components/TravelCountryEditor';
import TravelFavoriteMap from '@/components/TravelFavoriteMap';
import USStatesTracker from '@/components/USStatesTracker';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import {
  countrySlug,
  findCountryBySlug,
  travelerLabel,
  type Country,
  type TravelFavorite,
  type TravelPhoto,
  type TravelState,
  type TravelTrip,
} from '@/lib/travel';
import { ArrowLeft, CalendarDays, Camera, MapPin, Utensils, Waves } from 'lucide-react';
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

function favoriteLabel(type: TravelFavorite['type']) {
  if (type === 'restaurant') return 'Restaurant';
  if (type === 'activity') return 'Activity';
  return 'Place';
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

  const [{ data: trips }, { data: photos }, { data: favorites }] = await Promise.all([
    supabase
      .from('travel_trips')
      .select('id, country_id, state_id, title, location_name, started_on, ended_on, notes, baylor_went, isabel_went')
      .eq('country_id', country.id)
      .is('state_id', null)
      .order('started_on', { ascending: false, nullsFirst: false }),
    supabase
      .from('travel_photos')
      .select('id, country_id, state_id, trip_id, image_url, caption, location_name, taken_on, sort_order')
      .eq('country_id', country.id)
      .is('state_id', null)
      .order('sort_order')
      .order('taken_on', { ascending: false, nullsFirst: false }),
    supabase
      .from('travel_favorites')
      .select('id, country_id, state_id, trip_id, type, name, location_name, latitude, longitude, notes, sort_order')
      .eq('country_id', country.id)
      .is('state_id', null)
      .order('sort_order')
      .order('name'),
  ]);

  const tripRows = (trips ?? []) as TravelTrip[];
  const photoRows = (photos ?? []) as TravelPhoto[];
  const favoriteRows = (favorites ?? []) as TravelFavorite[];
  const restaurants = favoriteRows.filter((favorite) => favorite.type === 'restaurant');
  const activities = favoriteRows.filter((favorite) => favorite.type !== 'restaurant');
  const isUnitedStates = countrySlug(country) === 'united-states';
  const { data: states } = isUnitedStates
    ? await supabase
        .from('visited_states')
        .select('id, state_name, abbreviation, baylor_visited, isabel_visited')
        .order('state_name')
    : { data: null };
  const stateRows = (states ?? []) as TravelState[];

  return (
    <main className="min-h-screen bg-white">
      <Header />

      <section className="border-b border-slate-100 bg-slate-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
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
                {travelerLabel(country)} visited. {tripRows.length} trips logged, {photoRows.length} photos saved,{' '}
                {favoriteRows.length} favorite spots.
              </p>
            </div>
          </div>
        </div>
      </section>

      {isUnitedStates && <USStatesTracker states={stateRows} showHeading={false} />}

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
              <Camera className="h-5 w-5 text-slate-400" />
            </div>

            {photoRows.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {photoRows.map((photo) => (
                  <figure key={photo.id} className="overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.image_url} alt={photo.caption ?? country.display_name} className="h-52 w-full object-cover" />
                    <figcaption className="px-3 py-2 text-sm text-slate-600">
                      {photo.caption ?? photo.location_name ?? country.display_name}
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
                No photos yet.
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Favorite Map</h2>
                <p className="text-sm text-slate-500">Restaurants, activities, and memorable places.</p>
              </div>
              <MapPin className="h-5 w-5 text-slate-400" />
            </div>

            <TravelFavoriteMap favorites={favoriteRows} />

            <div className="space-y-3">
              {favoriteRows.slice(0, 6).map((favorite, index) => (
                <div key={favorite.id} className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{favorite.name}</p>
                    <p className="text-xs text-slate-500">
                      {favoriteLabel(favorite.type)}
                      {favorite.location_name ? ` · ${favorite.location_name}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div className="lg:col-span-2">
            <div className="mb-5 flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-teal-600" />
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
                      {formatDateRange(trip) && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                          {formatDateRange(trip)}
                        </span>
                      )}
                    </div>
                    {trip.notes && <p className="mt-4 text-sm leading-6 text-slate-600">{trip.notes}</p>}
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-400">
                No trips logged yet.
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center gap-3">
                <Utensils className="h-5 w-5 text-teal-600" />
                <h2 className="text-lg font-bold text-slate-950">Restaurants</h2>
              </div>
              {restaurants.length > 0 ? (
                <div className="space-y-3">
                  {restaurants.map((restaurant) => (
                    <div key={restaurant.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                      <p className="text-sm font-semibold text-slate-800">{restaurant.name}</p>
                      <p className="text-xs text-slate-500">{restaurant.location_name ?? country.display_name}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No restaurants yet.</p>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center gap-3">
                <Waves className="h-5 w-5 text-teal-600" />
                <h2 className="text-lg font-bold text-slate-950">Activities</h2>
              </div>
              {activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                      <p className="text-sm font-semibold text-slate-800">{activity.name}</p>
                      <p className="text-xs text-slate-500">{activity.location_name ?? country.display_name}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No activities yet.</p>
              )}
            </div>
          </aside>
        </div>
      </section>
      <TravelCountryEditor country={country} trips={tripRows} photos={photoRows} favorites={favoriteRows} />
        </>
      )}
    </main>
  );
}
