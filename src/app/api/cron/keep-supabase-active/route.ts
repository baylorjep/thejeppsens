import { getSupabaseServerClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) return new Response('Database is not configured', { status: 503 });

  for (const table of ['visited_countries', 'travel_trips', 'travel_photos']) {
    const { error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      console.error(`Supabase keepalive failed for ${table}:`, error);
      return new Response('Database read failed', { status: 503 });
    }
  }

  return Response.json({ ok: true });
}
