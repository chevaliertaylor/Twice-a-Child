import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { ScreenContainer } from '../components/ScreenContainer';
import { PrimaryButton } from '../components/PrimaryButton';
import { useSession } from '../state/SessionContext';
import {
  getCurrentPackage,
  isEntitled,
  purchasePackage,
  restorePurchases,
} from '../lib/purchases';
import { colors, spacing } from '../theme';

/**
 * Shown to an authenticated user without an active subscription (PRD §3). Sells
 * the RevenueCat package; on success the entitlement listener flips the app to
 * the home screen.
 */
export function PaywallScreen() {
  const { refreshEntitlement, signOut } = useSession();
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentPackage()
      .then(setPkg)
      .finally(() => setLoading(false));
  }, []);

  const buy = async () => {
    if (!pkg) return;
    setBusy(true);
    setError(null);
    const info = await purchasePackage(pkg);
    setBusy(false);
    if (info && isEntitled(info)) {
      await refreshEntitlement();
    } else {
      setError('Purchase did not complete.');
    }
  };

  const restore = async () => {
    setBusy(true);
    setError(null);
    const info = await restorePurchases();
    setBusy(false);
    if (info && isEntitled(info)) {
      await refreshEntitlement();
    } else {
      setError('No active subscription found to restore.');
    }
  };

  const priceLabel = pkg?.product.priceString ?? '$5.99';

  return (
    <ScreenContainer
      title="Subscribe to continue"
      subtitle={`${priceLabel} / month after a 7-day free trial.`}
      footer={
        <>
          <PrimaryButton
            label={busy ? 'Please wait…' : 'Start free trial'}
            onPress={buy}
            disabled={busy || loading || !pkg}
          />
          <PrimaryButton label="Restore purchases" variant="secondary" onPress={restore} />
          <Pressable accessibilityRole="button" onPress={signOut}>
            <Text style={styles.signOut}>Sign out</Text>
          </Pressable>
        </>
      }
    >
      {loading ? (
        <ActivityIndicator color={colors.accent} />
      ) : (
        <View style={styles.body}>
          <Text style={styles.line}>• Daily companionship for your parent</Text>
          <Text style={styles.line}>• Wellbeing summaries delivered to you</Text>
          <Text style={styles.line}>• Urgent alerts when something seems wrong</Text>
          {!pkg && (
            <Text style={styles.note}>
              Subscriptions aren't available on this device. Use a development or production build
              with billing configured.
            </Text>
          )}
          {error && <Text style={styles.error}>{error}</Text>}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.sm },
  line: { fontSize: 17, color: colors.textPrimary },
  note: { fontSize: 14, color: colors.textMuted, marginTop: spacing.sm },
  error: { fontSize: 15, color: colors.danger, marginTop: spacing.sm },
  signOut: {
    fontSize: 16,
    color: colors.accent,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
});
