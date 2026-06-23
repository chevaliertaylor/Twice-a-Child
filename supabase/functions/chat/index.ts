// POST /functions/v1/chat
// Body: { conversationId?: string, message: string, modality?: 'text' | 'voice' }
//
// Records the parent's message, generates the companion's reply, classifies the
// parent message for urgent concern, and raises an alert on a high signal.
import { authedClient, corsHeaders, json } from '../_shared/http.ts';
import { classifyConcern, companionReply, type ChatTurn } from '../_shared/claude.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const auth = await authedClient(req);
  if (!auth) return json({ error: 'unauthorized' }, 401);
  const { supabase, userId } = auth;

  let body: { conversationId?: string; message?: string; modality?: 'text' | 'voice' };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const text = body.message?.trim();
  if (!text) return json({ error: 'message_required' }, 400);
  const modality = body.modality ?? 'text';

  // Resolve (or open) the conversation.
  let conversationId = body.conversationId;
  if (!conversationId) {
    const { data, error } = await supabase
      .from('conversation')
      .insert({ account_id: userId })
      .select('id')
      .single();
    if (error) return json({ error: 'conversation_create_failed', detail: error.message }, 500);
    conversationId = data.id;
  }

  // Persist the parent's message.
  const { error: insertErr } = await supabase.from('message').insert({
    account_id: userId,
    conversation_id: conversationId,
    sender: 'parent',
    modality,
    content: text,
  });
  if (insertErr) return json({ error: 'message_insert_failed', detail: insertErr.message }, 500);

  // Load recent history + profile context for the companion.
  const { data: history } = await supabase
    .from('message')
    .select('sender, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(40);

  const { data: profiles } = await supabase
    .from('profile')
    .select('role, display_name')
    .eq('account_id', userId);

  const childName = profiles?.find((p) => p.role === 'child')?.display_name ?? undefined;
  const parentName = profiles?.find((p) => p.role === 'parent')?.display_name ?? undefined;

  // Generate reply and classify concern in parallel.
  const [reply, concern] = await Promise.all([
    companionReply((history ?? []) as ChatTurn[], { childName, parentName }),
    classifyConcern(text),
  ]);

  await supabase.from('message').insert({
    account_id: userId,
    conversation_id: conversationId,
    sender: 'companion',
    modality: 'text',
    content: reply,
  });

  // Raise a real-time alert for high-concern signals (PRD §8.3).
  if (concern.concern_level === 'high') {
    await supabase.from('alert').insert({
      account_id: userId,
      conversation_id: conversationId,
      category: concern.category,
      severity: 'high',
      description: concern.rationale,
    });
  }

  return json({ conversationId, reply, concern });
});
