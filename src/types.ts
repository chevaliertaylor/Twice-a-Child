/** Domain types shared across the onboarding flow and landing screens. */

export type Role = 'parent' | 'child';

export type PlanChoice = 'trial' | 'subscribe';

export type Cadence = 'daily' | 'few_days' | 'weekly';

/** An avatar is either a generated likeness from a photo, or a preset pick. */
export type AvatarSelection =
  | { kind: 'photo'; uri: string }
  | { kind: 'preset'; id: string };

/** Child-configured notification & check-in preferences (PRD §5.4). */
export interface ChildPreferences {
  summaryFrequency: Cadence;
  summaryTime: string; // e.g. "08:00"
  checkInFrequency: Cadence;
  checkInWindow: 'morning' | 'midday' | 'evening';
  urgentAlerts: boolean;
}

/** Everything collected during onboarding. In-memory only for now — no backend. */
export interface OnboardingData {
  email?: string;
  password?: string;
  plan?: PlanChoice;
  role?: Role;
  avatar?: AvatarSelection;
  childPreferences?: ChildPreferences;
}

/** Curated, multicultural preset avatar library (PRD §5.2). */
export interface PresetAvatar {
  id: string;
  label: string;
  emoji: string;
}

export const PRESET_AVATARS: PresetAvatar[] = [
  { id: 'a1', label: 'Warm', emoji: '👩🏽' },
  { id: 'a2', label: 'Kind', emoji: '👨🏿' },
  { id: 'a3', label: 'Gentle', emoji: '👵🏻' },
  { id: 'a4', label: 'Bright', emoji: '👨🏻' },
  { id: 'a5', label: 'Calm', emoji: '👩🏿' },
  { id: 'a6', label: 'Cheerful', emoji: '👨🏽' },
  { id: 'a7', label: 'Caring', emoji: '👩🏻' },
  { id: 'a8', label: 'Steady', emoji: '👴🏾' },
];
