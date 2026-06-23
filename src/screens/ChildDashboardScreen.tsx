import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fetchLatestSummary, fetchOpenAlerts, type AlertRow, type SummaryRow } from '../api/db';
import { colors, radius, spacing } from '../theme';

/** Child dashboard (PRD §7): wellbeing summary, urgent alerts, stat tiles. */
export function ChildDashboardScreen({ onOpenSettings }: { onOpenSettings: () => void }) {
  const [summary, setSummary] = useState<SummaryRow | null>(null);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, a] = await Promise.all([fetchLatestSummary(), fetchOpenAlerts()]);
      setSummary(s);
      setAlerts(a);
    } catch {
      // Network/backend not configured yet — leave placeholders.
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>Dashboard</Text>
          <Pressable accessibilityRole="button" onPress={onOpenSettings}>
            <Text style={styles.signOut}>Settings</Text>
          </Pressable>
        </View>

        {alerts.map((a) => (
          <View key={a.id} style={styles.alert}>
            <Text style={styles.alertTitle}>⚠️ Needs attention · {a.category}</Text>
            <Text style={styles.alertText}>{a.description}</Text>
            <Text style={styles.disclaimer}>
              A communication tool, not a medical or emergency service.
            </Text>
          </View>
        ))}

        <View style={styles.grid}>
          <StatCard label="Mood" value={summary?.mood ?? '—'} />
          <StatCard label="Sleep" value={summary?.sleep ?? '—'} />
          <StatCard
            label="Concern"
            value={summary ? summary.concern_level : '—'}
          />
          <StatCard
            label="Last update"
            value={summary ? new Date(summary.created_at).toLocaleDateString() : '—'}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Latest summary</Text>
          <Text style={styles.summaryText}>
            {summary?.summary_text ?? 'No summaries yet. They appear here after the first check-in.'}
          </Text>
          {summary && summary.highlights.length > 0 && (
            <View style={styles.highlights}>
              {summary.highlights.map((h, i) => (
                <Text key={i} style={styles.highlight}>
                  • {h}
                </Text>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  scroll: { padding: spacing.lg, gap: spacing.md },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 30, fontWeight: '700', color: colors.textPrimary },
  signOut: { fontSize: 15, color: colors.accent, fontWeight: '600' },
  alert: {
    backgroundColor: '#FBE9EB',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  alertTitle: { fontSize: 16, fontWeight: '700', color: colors.danger },
  alertText: { fontSize: 15, color: colors.textPrimary },
  disclaimer: { fontSize: 12, color: colors.textMuted },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  statCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  statLabel: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardLabel: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
  summaryText: { fontSize: 16, color: colors.textPrimary, lineHeight: 22 },
  highlights: { gap: 2 },
  highlight: { fontSize: 15, color: colors.textSecondary },
});
