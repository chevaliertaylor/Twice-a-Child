import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useOnboarding } from '../state/OnboardingContext';
import { colors, radius, spacing } from '../theme';

interface StatCardProps {
  label: string;
  value: string;
  detail?: string;
}

function StatCard({ label, value, detail }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{value}</Text>
      {detail && <Text style={styles.cardDetail}>{detail}</Text>}
    </View>
  );
}

/**
 * Child dashboard (PRD §7). Shows placeholder wellbeing tiles until summaries
 * start arriving from the backend.
 */
export function ChildDashboardScreen() {
  const { data } = useOnboarding();
  const cadence = data.childPreferences?.summaryFrequency ?? 'daily';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Summaries arrive {cadence.replace('_', ' ')}.</Text>

        <View style={styles.grid}>
          <StatCard label="Mood" value="—" detail="No data yet" />
          <StatCard label="Last check-in" value="—" detail="Awaiting first chat" />
          <StatCard label="Sleep" value="—" detail="Self-reported" />
          <StatCard label="Engagement" value="—" detail="Responses & length" />
        </View>

        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>You're all set</Text>
          <Text style={styles.bannerText}>
            Once your parent starts chatting, their wellbeing summaries and any urgent alerts will
            appear here.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  card: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  cardValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cardDetail: {
    fontSize: 13,
    color: colors.textMuted,
  },
  banner: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  bannerText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 21,
  },
});
