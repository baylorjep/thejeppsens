import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'No DB' }, { status: 503 });

  const { data, error } = await supabase
    .from('visited_countries')
    .select('id, geo_name, display_name, flag, continent, baylor_visited, isabel_visited')
    .order('continent')
    .order('display_name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ countries: data });
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) return NextResponse.json({ error: 'No DB' }, { status: 503 });

    const body = await request.json();
    const displayName = typeof body.display_name === 'string' ? body.display_name.trim() : '';
    const geoName = typeof body.geo_name === 'string' && body.geo_name.trim() ? body.geo_name.trim() : displayName;
    const continent = typeof body.continent === 'string' ? body.continent.trim() : '';

    if (!displayName || !geoName || !continent) {
      return NextResponse.json({ error: 'Country, map name, and continent are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('visited_countries')
      .upsert(
        {
          geo_name: geoName,
          display_name: displayName,
          flag: typeof body.flag === 'string' ? body.flag.trim() : '',
          continent,
          baylor_visited: Boolean(body.baylor_visited),
          isabel_visited: Boolean(body.isabel_visited),
        },
        { onConflict: 'geo_name' },
      )
      .select('id, geo_name, display_name, flag, continent, baylor_visited, isabel_visited')
      .single();

    if (error) throw error;
    return NextResponse.json({ country: data });
  } catch (error) {
    console.error('Could not save country', error);
    return NextResponse.json({ error: 'Could not save country' }, { status: 500 });
  }
}
