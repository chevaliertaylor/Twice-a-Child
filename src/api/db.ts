import { supabase } from '../lib/supabase';
import type {
  AvatarSelection,
  ChildPreferences,
  ConcernLevel,
  OnboardingData,
  Role,
} from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Persist everything collected during onboarding for the signed-in user. */
export async function saveOnboarding(userId: string, data: OnboardingData): Promise<void> {
  if (data.plan) {
    await supabase
      .from('account')
      .update({
        plan: data.plan,
        trial_ends_at: data.plan === 'trial' ? new Date(Date.now() + 7 * DAY_MS).toISOString() : null,
      })
      .eq('id', userId);
  }

  if (data.role) {
    const avatar = data.avatar;
    await supabase.from('profile').upsert(
      {
        account_id: userId,
        role: data.role,
        avatar_kind: avatar?.kind ?? null,
        avatar_ref: avatar ? (avatar.kind === 'preset' ? avatar.id : avatar.uri) : null,
      },
      { onConflict: 'account_id,role' },
    );
  }

  if (data.role === 'child' && data.childPreferences) {
    const p = data.childPreferences;
    await supabase.from('preferences').upsert({
      account_id: userId,
      summary_frequency: p.summaryFrequency,
      summary_time: p.summaryTime,
      checkin_frequency: p.checkInFrequency,
      checkin_window: p.checkInWindow,
      urgent_alerts: p.urgentAlerts,
      updated_at: new Date().toISOString(),
    });
  }
}

/** Load the child's saved preferences. */
export async function fetchPreferences(userId: string): Promise<ChildPreferences | null> {
  const { data } = await supabase
    .from('preferences')
    .select(
      'summary_frequency, summary_time, checkin_frequency, checkin_window, urgent_alerts',
    )
    .eq('account_id', userId)
    .maybeSingle();
  if (!data) return null;
  return {
    summaryFrequency: data.summary_frequency,
    summaryTime: data.summary_time,
    checkInFrequency: data.checkin_frequency,
    checkInWindow: data.checkin_window,
    urgentAlerts: data.urgent_alerts,
  };
}

/** Record the parent device's IANA timezone so check-ins fire in local time. */
export async function updateTimezone(userId: string, timezone: string): Promise<void> {
  await supabase.from('preferences').update({ timezone }).eq('account_id', userId);
}

export async function savePreferences(userId: string, p: ChildPreferences): Promise<void> {
  await supabase.from('preferences').upsert({
    account_id: userId,
    summary_frequency: p.summaryFrequency,
    summary_time: p.summaryTime,
    checkin_frequency: p.checkInFrequency,
    checkin_window: p.checkInWindow,
    urgent_alerts: p.urgentAlerts,
    updated_at: new Date().toISOString(),
  });
}

export async function updateAvatar(
  userId: string,
  role: Role,
  avatar: AvatarSelection,
): Promise<void> {
  await supabase.from('profile').upsert(
    {
      account_id: userId,
      role,
      avatar_kind: avatar.kind,
      avatar_ref: avatar.kind === 'preset' ? avatar.id : avatar.uri,
    },
    { onConflict: 'account_id,role' },
  );
}

/** Store (or refresh) this device's Expo push token. */
export async function saveDeviceToken(
  userId: string,
  role: Role,
  token: string,
  platform: string,
): Promise<void> {
  await supabase.from('device').upsert(
    {
      account_id: userId,
      role,
      expo_push_token: token,
      platform,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'account_id,expo_push_token' },
  );
}

function base64ToUint8Array(b64: string): Uint8Array {
  const binary = globalThis.atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Upload a JPEG (base64) to the private photos bucket and record it. */
export async function uploadPhoto(
  userId: string,
  role: Role,
  base64: string,
  caption?: string,
): Promise<void> {
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const { error } = await supabase.storage
    .from('photos')
    .upload(path, base64ToUint8Array(base64), { contentType: 'image/jpeg', upsert: false });
  if (error) throw error;
  await supabase
    .from('photo')
    .insert({ account_id: userId, sender: role, storage_path: path, caption: caption ?? null });
}

export interface PhotoItem {
  id: string;
  url: string | null;
  caption: string | null;
  created_at: string;
}

export async function fetchPhotos(): Promise<PhotoItem[]> {
  const { data } = await supabase
    .from('photo')
    .select('id, storage_path, caption, created_at')
    .order('created_at', { ascending: false })
    .limit(20);
  if (!data) return [];
  return Promise.all(
    data.map(async (r) => {
      const { data: signed } = await supabase.storage
        .from('photos')
        .createSignedUrl(r.storage_path, 3600);
      return { id: r.id, url: signed?.signedUrl ?? null, caption: r.caption, created_at: r.created_at };
    }),
  );
}

export interface ProfileRow {
  role: Role;
  display_name: string | null;
  avatar_kind: 'photo' | 'preset' | null;
  avatar_ref: string | null;
}

export async function fetchProfile(userId: string, role: Role): Promise<ProfileRow | null> {
  const { data } = await supabase
    .from('profile')
    .select('role, display_name, avatar_kind, avatar_ref')
    .eq('account_id', userId)
    .eq('role', role)
    .maybeSingle();
  return (data as ProfileRow | null) ?? null;
}

export interface ConcernResult {
  concern_level: ConcernLevel;
  category: string;
  rationale: string;
}

export interface ChatResponse {
  conversationId: string;
  reply: string;
  concern: ConcernResult;
}

/** Send a parent message to the companion via the `chat` Edge Function. */
export async function sendChat(args: {
  conversationId?: string;
  message: string;
  modality?: 'text' | 'voice';
}): Promise<ChatResponse> {
  const { data, error } = await supabase.functions.invoke<ChatResponse>('chat', { body: args });
  if (error) throw error;
  if (!data) throw new Error('Empty response from chat function');
  return data;
}

/** Transcribe a recorded voice message via the `transcribe` Edge Function. */
export async function transcribeAudio(audioBase64: string, mimeType: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{ text: string }>('transcribe', {
    body: { audioBase64, mimeType },
  });
  if (error) throw error;
  return data?.text ?? '';
}

export interface SummaryRow {
  id: string;
  summary_text: string;
  mood: string | null;
  sleep: string | null;
  concern_level: ConcernLevel;
  highlights: string[];
  created_at: string;
}

export async function fetchLatestSummary(): Promise<SummaryRow | null> {
  const { data } = await supabase
    .from('summary')
    .select('id, summary_text, mood, sleep, concern_level, highlights, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as SummaryRow | null) ?? null;
}

export interface AlertRow {
  id: string;
  category: string;
  severity: ConcernLevel;
  description: string;
  created_at: string;
}

export async function fetchOpenAlerts(): Promise<AlertRow[]> {
  const { data } = await supabase
    .from('alert')
    .select('id, category, severity, description, created_at')
    .is('acknowledged_at', null)
    .order('created_at', { ascending: false })
    .limit(10);
  return (data as AlertRow[] | null) ?? [];
}
