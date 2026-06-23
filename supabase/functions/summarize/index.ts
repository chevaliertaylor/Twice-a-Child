// POST /functions/v1/summarize
// Body: { conversationId: string }
//
// Generates a wellbeing summary for the child from a conversation transcript
// and stores it. Typically called when a check-in ends or on the child's
// configured cadence.
import { authedClient, corsHeaders, json } from '../_shared/http.ts';
import { summarizeConversation, type ChatTurn } from '../_shared/claude.ts';
import { sendExpoPush } from '../_shared/push.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const auth = await authedClient(req);
  if (!auth) return json({ error: 'unauthorized' }, 401);
  const { supabase, userId } = auth;

  let body: { conversationId?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const conversationId = body.conversationId;
  if (!conversationId) return json({ error: 'conversationId_required' }, 400);

  const { data: history, error } = await supabase
    .from('message')
    .select('sender, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) return json({ error: 'history_load_failed', detail: error.message }, 500);
  if (!history || history.length === 0) return json({ error: 'empty_conversation' }, 400);

  const summary = await summarizeConversation(history as ChatTurn[]);

  const { data: saved, error: saveErr } = await supabase
    .from('summary')
    .insert({
      account_id: userId,
      conversation_id: conversationId,
      summary_text: summary.summary_text,
      mood: summary.mood,
      energy: summary.energy,
      sleep: summary.sleep,
      appetite: summary.appetite,
      pain: summary.pain,
      social_contact: summary.social_contact,
      cognitive_flags: summary.cognitive_flags,
      highlights: summary.highlights,
      concern_level: summary.concern_level,
    })
    .select('id, created_at')
    .single();

  if (saveErr) return json({ error: 'summary_save_failed', detail: saveErr.message }, 500);

  // Notify the child that a fresh summary is available (PRD §7.2).
  const { data: devices } = await supabase
    .from('device')
    .select('expo_push_token')
    .eq('account_id', userId)
    .eq('role', 'child');

  await sendExpoPush(
    (devices ?? []).map((d) => ({
      to: d.expo_push_token,
      title: 'New wellbeing summary',
      body: summary.summary_text,
      data: { type: 'summary_ready', summaryId: saved.id },
    })),
  );

  return json({ id: saved.id, createdAt: saved.created_at, summary });
});
