import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

/**
 * Service-role client that bypasses RLS. Only for trusted server-side jobs (the
 * scheduled check-in cron) that must read across all accounts. SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY are injected into deployed functions automatically.
 */
export function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  );
}
