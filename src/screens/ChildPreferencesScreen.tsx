import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { PrimaryButton } from '../components/PrimaryButton';
import { Segmented } from '../components/Segmented';
import { useOnboarding } from '../state/OnboardingContext';
import type { Cadence, ChildPreferences } from '../types';
import { colors, spacing } from '../theme';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

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

export function ChildPreferencesScreen({ onNext, onBack }: Props) {
  const { update } = useOnboarding();
  const [prefs, setPrefs] = useState<ChildPreferences>({
    summaryFrequency: 'daily',
    summaryTime: '08:00',
    checkInFrequency: 'daily',
    checkInWindow: 'morning',
    urgentAlerts: true,
  });

  const patch = (p: Partial<ChildPreferences>) => setPrefs((prev) => ({ ...prev, ...p }));

  const handleContinue = () => {
    update({ childPreferences: prefs });
    onNext();
  };

  return (
    <ScreenContainer
      title="Your preferences"
      subtitle="You can change all of these later in Settings."
      onBack={onBack}
      footer={<PrimaryButton label="Finish setup" onPress={handleContinue} />}
    >
      <View style={styles.group}>
        <Text style={styles.label}>How often should we send you a summary?</Text>
        <Segmented
          options={CADENCE_OPTIONS}
          value={prefs.summaryFrequency}
          onChange={(v) => patch({ summaryFrequency: v })}
        />
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>How often should we check in on your parent?</Text>
        <Segmented
          options={CADENCE_OPTIONS}
          value={prefs.checkInFrequency}
          onChange={(v) => patch({ checkInFrequency: v })}
        />
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>Preferred check-in time</Text>
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
            Get notified right away if something seems wrong. This is a communication tool, not a
            medical or emergency service.
          </Text>
        </View>
        <Switch
          value={prefs.urgentAlerts}
          onValueChange={(v) => patch({ urgentAlerts: v })}
          trackColor={{ true: colors.accent, false: colors.border }}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.sm,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  hint: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowText: {
    flex: 1,
  },
});
