import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Build a request-scoped Supabase client that forwards the caller's JWT, so all
 * queries run under the user's identity and Row Level Security applies. Returns
 * the client plus the authenticated user id, or null if unauthenticated.
 */
export async function authedClient(
  req: Request,
): Promise<{ supabase: SupabaseClient; userId: string } | null> {
  const authorization = req.headers.get('Authorization');
  if (!authorization) return null;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authorization } } },
  );

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  return { supabase, userId: data.user.id };
}
