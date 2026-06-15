import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'No DB' }, { status: 503 });

  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ restaurants: data });
}

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'No DB' }, { status: 503 });

  const body = await request.json();
  const { name, cuisine, price, distance, tags } = body;

  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const { data, error } = await supabase
    .from('restaurants')
    .insert({ name, cuisine: cuisine ?? '', price: price ?? '$$', distance: distance ?? '', tags: tags ?? [] })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ restaurant: data });
}
