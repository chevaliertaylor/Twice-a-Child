import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { PrimaryButton } from '../components/PrimaryButton';
import { useOnboarding } from '../state/OnboardingContext';
import { colors, radius, spacing } from '../theme';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignUpScreen({ onNext, onBack }: Props) {
  const { update } = useOnboarding();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const emailValid = EMAIL_RE.test(email);
  const passwordValid = password.length >= 8;
  const canContinue = emailValid && passwordValid;

  const handleContinue = () => {
    update({ email, password });
    onNext();
  };

  return (
    <ScreenContainer
      title="Create your account"
      subtitle="One account works on both your phone and your parent's."
      onBack={onBack}
      footer={<PrimaryButton label="Continue" onPress={handleContinue} disabled={!canContinue} />}
    >
      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          inputMode="email"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="At least 8 characters"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          autoCapitalize="none"
        />
        {password.length > 0 && !passwordValid && (
          <Text style={styles.hint}>Use at least 8 characters.</Text>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: 17,
    color: colors.textPrimary,
  },
  hint: {
    fontSize: 14,
    color: colors.danger,
  },
});
