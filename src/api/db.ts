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
