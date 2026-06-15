import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'No DB' }, { status: 503 });

  const { id } = await params;
  const { error } = await supabase.from('movies').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
