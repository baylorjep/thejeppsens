import Header from '@/components/Header';
import USStatesMap from '@/components/USStatesMap';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import type { TravelState } from '@/lib/travel';
import type { VisitType } from '@/components/WorldMap';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ country: string }>;
}

function visitType(state: TravelState): VisitType | null {
  if (state.baylor_visited && state.isabel_visited) return 'both';
  if (state.baylor_visited) return 'baylor';
  if (state.isabel_visited) return 'isabel';
  return null;
}

const CARD_STYLE: Record<VisitType | 'none', string> = {
  both: 'border-teal-100 bg-teal-50 text-teal-800',
  baylor: 'border-blue-100 bg-blue-50 text-blue-800',
  isabel: 'border-purple-100 bg-purple-50 text-purple-800',
  none: 'border-slate-100 bg-white text-slate-500',
};

const PILL_LABEL: Record<VisitType | 'none', string> = {
  both: 'Both',
  baylor: 'Baylor',
  isabel: 'Isabel',
  none: 'Not yet',
};

export default async function UnitedStatesStatesPage({ params }: PageProps) {
  const { country } = await params;
  if (country !== 'united-states') notFound();

  const supabase = getSupabaseServerClient();
  if (!supabase) notFound();

  const { data } = await supabase
    .from('visited_states')
    .select('id, state_name, abbreviation, baylor_visited, isabel_visited')
    .order('state_name');

  const states = (data ?? []) as TravelState[];
  const visitedByState = states.reduce<Record<string, VisitType>>((acc, state) => {
    const type = visitType(state);
    if (type) acc[state.state_name] = type;
    return acc;
  }, {});
  const visitedCount = states.filter((state) => state.baylor_visited || state.isabel_visited).length;
  const sharedCount = states.filter((state) => state.baylor_visited && state.isabel_visited).length;
  const isabelCount = states.filter((state) => state.isabel_visited).length;
  const baylorCount = states.filter((state) => state.baylor_visited).length;

  return (
    <main className="min-h-screen bg-white">
      <Header />

      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <Link
            href="/travel/united-states"
            className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            United States
          </Link>

          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-teal-300">United States</p>
              <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">50 States Tracker</h1>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['Visited', visitedCount],
                ['Together', sharedCount],
                ['Baylor', baylorCount],
                ['Isabel', isabelCount],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-center">
                  <div className="text-2xl font-bold text-teal-300">{value}</div>
                  <div className="text-xs text-slate-400">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold text-slate-950">States Map</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-teal-500" />
                Both
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
                Baylor
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-purple-500" />
                Isabel
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-300" />
                Not yet
              </span>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:p-5">
            <USStatesMap visitedByState={visitedByState} />
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-xl font-bold text-slate-950">State List</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {states.map((state) => {
              const type = visitType(state) ?? 'none';
              return (
                <div key={state.id} className={`rounded-xl border p-4 transition-colors ${CARD_STYLE[type]}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold">{state.state_name}</p>
                      <p className="mt-1 text-xs opacity-70">{state.abbreviation}</p>
                    </div>
                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold">
                      {PILL_LABEL[type]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
