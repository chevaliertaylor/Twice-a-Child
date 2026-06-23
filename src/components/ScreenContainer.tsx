import type { ReactNode } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, spacing } from '../theme';

interface Props {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  onBack?: () => void;
}

/** Standard onboarding screen shell: optional back link, title block, scrollable body, pinned footer. */
export function ScreenContainer({ title, subtitle, children, footer, onBack }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.inner}>
        {onBack && (
          <Pressable accessibilityRole="button" onPress={onBack} style={styles.back}>
            <Text style={styles.backText}>‹ Back</Text>
          </Pressable>
        )}
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          <View style={styles.body}>{children}</View>
        </ScrollView>
        {footer && <View style={styles.footer}>{footer}</View>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  back: {
    paddingVertical: spacing.sm,
  },
  backText: {
    fontSize: 17,
    color: colors.accent,
    fontWeight: '600',
  },
  scroll: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 17,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  body: {
    marginTop: spacing.lg,
    gap: spacing.md,
    flex: 1,
  },
  footer: {
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
});
