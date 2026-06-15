import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'No DB' }, { status: 503 });

  const { data, error } = await supabase
    .from('visited_countries')
    .select('id, geo_name, display_name, flag, continent')
    .order('continent')
    .order('display_name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ countries: data });
}
