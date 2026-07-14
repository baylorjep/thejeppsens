import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'No DB' }, { status: 503 });

  const { data, error } = await supabase
    .from('visited_states')
    .select('id, state_name, abbreviation, baylor_visited, isabel_visited')
    .order('state_name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ states: data });
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) return NextResponse.json({ error: 'No DB' }, { status: 503 });

    const body = await request.json();
    const id = typeof body.id === 'string' ? body.id.trim() : '';

    if (!id) {
      return NextResponse.json({ error: 'State is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('visited_states')
      .update({
        baylor_visited: Boolean(body.baylor_visited),
        isabel_visited: Boolean(body.isabel_visited),
      })
      .eq('id', id)
      .select('id, state_name, abbreviation, baylor_visited, isabel_visited')
      .single();

    if (error) throw error;
    return NextResponse.json({ state: data });
  } catch (error) {
    console.error('Could not save state', error);
    return NextResponse.json({ error: 'Could not save state' }, { status: 500 });
  }
}
