// POST /functions/v1/transcribe
// Body: { audioBase64: string, mimeType?: string } → { text }
//
// Speech-to-text for the parent's voice messages. The Claude Messages API does
// not accept audio, so transcription uses a dedicated STT provider (OpenAI
// Whisper here, keyed by OPENAI_API_KEY) — swap for any STT you prefer.
import { authedClient, corsHeaders, json } from '../_shared/http.ts';

const WHISPER_URL = 'https://api.openai.com/v1/audio/transcriptions';

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const auth = await authedClient(req);
  if (!auth) return json({ error: 'unauthorized' }, 401);

  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) return json({ error: 'stt_not_configured' }, 501);

  let body: { audioBase64?: string; mimeType?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  if (!body.audioBase64) return json({ error: 'audio_required' }, 400);

  const mimeType = body.mimeType ?? 'audio/m4a';
  const ext = mimeType.split('/')[1]?.split(';')[0] ?? 'm4a';
  const blob = new Blob([base64ToBytes(body.audioBase64)], { type: mimeType });

  const form = new FormData();
  form.append('file', blob, `audio.${ext}`);
  form.append('model', 'whisper-1');
  form.append('response_format', 'json');

  const res = await fetch(WHISPER_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    return json({ error: 'stt_failed', detail: await res.text() }, 502);
  }

  const data = (await res.json()) as { text?: string };
  return json({ text: data.text ?? '' });
});
