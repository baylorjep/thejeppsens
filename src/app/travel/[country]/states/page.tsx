import Header from '@/components/Header';
import USStatesTracker from '@/components/USStatesTracker';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import type { Country, TravelPhoto, TravelState, TravelStatePhotoPreview } from '@/lib/travel';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ country: string }>;
}

export default async function UnitedStatesStatesPage({ params }: PageProps) {
  const { country } = await params;
  if (country !== 'united-states') notFound();

  const supabase = getSupabaseServerClient();
  if (!supabase) notFound();

  const [{ data }, { data: countryRows }] = await Promise.all([
    supabase
      .from('visited_states')
      .select('id, state_name, abbreviation, baylor_visited, isabel_visited')
      .order('state_name'),
    supabase
      .from('visited_countries')
      .select('id')
      .eq('geo_name', 'United States of America')
      .single(),
  ]);

  const states = (data ?? []) as TravelState[];
  const unitedStates = countryRows as Pick<Country, 'id'> | null;
  const { data: statePhotos } = unitedStates
    ? await supabase
        .from('travel_photos')
        .select('id, country_id, state_id, trip_id, image_url, caption, location_name, latitude, longitude, taken_on, sort_order, is_featured, is_favorite_featured, created_at')
        .eq('country_id', unitedStates.id)
        .not('state_id', 'is', null)
        .order('is_featured', { ascending: false })
        .order('taken_on', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .order('sort_order')
    : { data: null };
  const stateById = new Map(states.map((state) => [state.id, state]));
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

  return (
    <main className="min-h-screen bg-white">
      <Header />

      <section className="border-b border-slate-100 bg-slate-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <Link
            href="/travel/united-states"
            className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            United States
          </Link>
        </div>
      </section>

      <USStatesTracker states={states} photoPreviews={statePhotoPreviews} />
    </main>
  );
}
