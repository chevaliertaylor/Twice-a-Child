import { StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, spacing } from '../theme';

export function WelcomeScreen({ onNext }: { onNext: () => void }) {
  return (
    <ScreenContainer
      footer={
        <>
          <PrimaryButton label="Get started" onPress={onNext} />
          <PrimaryButton label="I already have an account" variant="secondary" onPress={onNext} />
        </>
      }
    >
      <View style={styles.hero}>
        <Text style={styles.brand}>Twice a Child</Text>
        <Text style={styles.tagline}>
          A warm daily check-in for your parent — and peace of mind for you.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  brand: {
    fontSize: 38,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tagline: {
    fontSize: 19,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    lineHeight: 26,
  },
});
