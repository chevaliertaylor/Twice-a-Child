import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { PrimaryButton } from '../components/PrimaryButton';
import { useOnboarding } from '../state/OnboardingContext';
import type { Cadence, ChildPreferences } from '../types';
import { colors, radius, spacing } from '../theme';

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

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segment}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(opt.value)}
            style={[styles.segmentItem, active && styles.segmentItemActive]}
          >
            <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

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
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md - 2,
    alignItems: 'center',
  },
  segmentItemActive: {
    backgroundColor: colors.accent,
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  segmentLabelActive: {
    color: colors.surface,
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
