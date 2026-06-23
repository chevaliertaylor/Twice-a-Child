import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useOnboarding } from '../state/OnboardingContext';
import { PRESET_AVATARS } from '../types';
import { colors, radius, spacing } from '../theme';

/**
 * Parent landing page (PRD §6). Intentionally minimal and warm: the child's
 * avatar greets the parent. The chat composer is shown but not yet wired to a
 * model — that's the next slice.
 */
export function ParentLandingScreen() {
  const { data } = useOnboarding();
  const avatar = data.avatar;
  const avatarEmoji =
    avatar?.kind === 'preset'
      ? PRESET_AVATARS.find((a) => a.id === avatar.id)?.emoji ?? '🙂'
      : '🙂';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.avatarBubble}>
          <Text style={styles.avatarEmoji}>{avatarEmoji}</Text>
        </View>
        <Text style={styles.greeting}>Morning! How are you feeling today?</Text>

        <View style={styles.composer}>
          <Text style={styles.composerPlaceholder}>Tap to talk or type…</Text>
        </View>
        <Text style={styles.note}>Chat is coming online soon.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  avatarBubble: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  avatarEmoji: {
    fontSize: 84,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 32,
  },
  composer: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  composerPlaceholder: {
    fontSize: 18,
    color: colors.textMuted,
  },
  note: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
