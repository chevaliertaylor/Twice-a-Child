import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { PrimaryButton } from '../components/PrimaryButton';
import { useOnboarding } from '../state/OnboardingContext';
import { useSession } from '../state/SessionContext';
import { colors, radius, spacing } from '../theme';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignUpScreen({ onNext, onBack }: Props) {
  const { update } = useOnboarding();
  const { signUp, signIn } = useSession();
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = EMAIL_RE.test(email);
  const passwordValid = password.length >= 8;
  const canSubmit = emailValid && passwordValid && !busy;

  const handleSubmit = async () => {
    setBusy(true);
    setError(null);
    const { error: authError } =
      mode === 'signup' ? await signUp(email, password) : await signIn(email, password);
    setBusy(false);
    if (authError) {
      setError(authError);
      return;
    }
    update({ email, password });
    onNext();
  };

  return (
    <ScreenContainer
      title={mode === 'signup' ? 'Create your account' : 'Welcome back'}
      subtitle="One account works on both your phone and your parent's."
      onBack={onBack}
      footer={
        <>
          <PrimaryButton
            label={busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Log in'}
            onPress={handleSubmit}
            disabled={!canSubmit}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setMode(mode === 'signup' ? 'login' : 'signup');
              setError(null);
            }}
          >
            <Text style={styles.toggle}>
              {mode === 'signup' ? 'I already have an account' : 'Create a new account'}
            </Text>
          </Pressable>
        </>
      }
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

      {error && <Text style={styles.error}>{error}</Text>}
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
  error: {
    fontSize: 15,
    color: colors.danger,
  },
  toggle: {
    fontSize: 16,
    color: colors.accent,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
});
