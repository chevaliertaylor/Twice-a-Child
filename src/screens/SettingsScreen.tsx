import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { PrimaryButton } from '../components/PrimaryButton';
import { Segmented } from '../components/Segmented';
import { useSession } from '../state/SessionContext';
import { fetchPreferences, savePreferences } from '../api/db';
import type { Cadence, ChildPreferences } from '../types';
import { colors, spacing } from '../theme';

const CADENCE_OPTIONS: { value: Cadence; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'few_days', label: 'Every few days' },
  { value: 'weekly', label: 'Weekly' },
];

const WINDOW_OPTIONS: { value: ChildPreferences['checkInWindow']; label: string }[] = [
  { value: 'morning', label: 'Morning' },
  { value: 'midday', label: 'Midday' },
  { value: 'evening', label: 'Evening' },
];

const DEFAULT_PREFS: ChildPreferences = {
  summaryFrequency: 'daily',
  summaryTime: '08:00',
  checkInFrequency: 'daily',
  checkInWindow: 'morning',
  urgentAlerts: true,
};

export function SettingsScreen({ onBack }: { onBack: () => void }) {
  const { session, deviceRole, signOut } = useSession();
  const isChild = deviceRole === 'child';

  const [prefs, setPrefs] = useState<ChildPreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(isChild);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isChild || !session) return;
    fetchPreferences(session.user.id)
      .then((p) => p && setPrefs(p))
      .finally(() => setLoading(false));
  }, [isChild, session]);

  const patch = (p: Partial<ChildPreferences>) => {
    setSaved(false);
    setPrefs((prev) => ({ ...prev, ...p }));
  };

  const handleSave = async () => {
    if (!session) return;
    setSaving(true);
    try {
      await savePreferences(session.user.id, prefs);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer title="Settings" onBack={onBack}>
        <ActivityIndicator color={colors.accent} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      title="Settings"
      onBack={onBack}
      footer={
        <>
          {isChild && (
            <PrimaryButton
              label={saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save changes'}
              onPress={handleSave}
              disabled={saving}
            />
          )}
          <PrimaryButton label="Sign out" variant="secondary" onPress={signOut} />
        </>
      }
    >
      {isChild ? (
        <>
          <View style={styles.group}>
            <Text style={styles.label}>Summary frequency</Text>
            <Segmented
              options={CADENCE_OPTIONS}
              value={prefs.summaryFrequency}
              onChange={(v) => patch({ summaryFrequency: v })}
            />
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>Check-in frequency</Text>
            <Segmented
              options={CADENCE_OPTIONS}
              value={prefs.checkInFrequency}
              onChange={(v) => patch({ checkInFrequency: v })}
            />
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>Check-in time</Text>
            <Segmented
              options={WINDOW_OPTIONS}
              value={prefs.checkInWindow}
              onChange={(v) => patch({ checkInWindow: v })}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.label}>Urgent alerts</Text>
              <Text style={styles.hint}>
                Get notified right away if something seems wrong. A communication tool, not a
                medical or emergency service.
              </Text>
            </View>
            <Switch
              value={prefs.urgentAlerts}
              onValueChange={(v) => patch({ urgentAlerts: v })}
              trackColor={{ true: colors.accent, false: colors.border }}
            />
          </View>
        </>
      ) : (
        <Text style={styles.hint}>
          Your child manages check-in and summary settings. You can sign out below.
        </Text>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  label: { fontSize: 17, fontWeight: '600', color: colors.textPrimary },
  hint: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowText: { flex: 1 },
});
