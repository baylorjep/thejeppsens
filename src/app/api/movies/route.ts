import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'No DB' }, { status: 503 });

  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ movies: data });
}

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'No DB' }, { status: 503 });

  const body = await request.json();
  const { title, genre, length, type, poster, trailer } = body;

  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });

  const { data, error } = await supabase
    .from('movies')
    .insert({ title, genre: genre ?? '', length: length ?? '', type: type ?? 'live-action', poster, trailer })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ movie: data });
}
