// POST /functions/v1/checkin-cron
// Trusted scheduled job (no user JWT). Guarded by the x-cron-secret header.
// Run hourly (see supabase/README.md → Scheduling). For each account, if a
// proactive check-in is due per the child's preferences, push a naturally
// worded prompt to the parent device(s) and record the time.
import { adminClient } from '../_shared/admin.ts';
import { sendExpoPush } from '../_shared/push.ts';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// Window → hour of day (UTC for v1; per-timezone scheduling is a later slice).
const WINDOW_HOUR: Record<string, number> = { morning: 9, midday: 12, evening: 18 };

// Minimum gap between check-ins by cadence (with slack so an hourly cron fires once).
const MIN_GAP_MS: Record<string, number> = {
  daily: 20 * HOUR_MS,
  few_days: 3 * DAY_MS - HOUR_MS,
  weekly: 7 * DAY_MS - HOUR_MS,
};

const PROMPTS: Record<string, string> = {
  morning: 'Morning! How are you feeling today?',
  midday: 'Hi! Just checking in — how is your day going?',
  evening: 'Hi! How was your day today?',
};

function isDue(
  now: Date,
  frequency: string,
  windowName: string,
  lastCheckinAt: string | null,
): boolean {
  if (now.getUTCHours() !== (WINDOW_HOUR[windowName] ?? 9)) return false;
  if (!lastCheckinAt) return true;
  const gap = MIN_GAP_MS[frequency] ?? DAY_MS;
  return now.getTime() - new Date(lastCheckinAt).getTime() >= gap;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method_not_allowed', { status: 405 });

  const secret = Deno.env.get('CRON_SECRET');
  if (!secret || req.headers.get('x-cron-secret') !== secret) {
    return new Response('unauthorized', { status: 401 });
  }

  const admin = adminClient();
  const now = new Date();

  const { data: prefs, error } = await admin
    .from('preferences')
    .select('account_id, checkin_frequency, checkin_window, last_checkin_at');
  if (error) return new Response(error.message, { status: 500 });

  let sent = 0;
  for (const p of prefs ?? []) {
    if (!isDue(now, p.checkin_frequency, p.checkin_window, p.last_checkin_at)) continue;

    const { data: devices } = await admin
      .from('device')
      .select('expo_push_token')
      .eq('account_id', p.account_id)
      .eq('role', 'parent');

    if (!devices || devices.length === 0) continue;

    await sendExpoPush(
      devices.map((d) => ({
        to: d.expo_push_token,
        title: 'A message for you',
        body: PROMPTS[p.checkin_window] ?? PROMPTS.morning,
        data: { type: 'checkin_prompt' },
      })),
    );

    await admin
      .from('preferences')
      .update({ last_checkin_at: now.toISOString() })
      .eq('account_id', p.account_id);
    sent += 1;
  }

  return new Response(JSON.stringify({ checked: prefs?.length ?? 0, sent }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
