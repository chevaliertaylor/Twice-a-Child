import { ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';
import { useSession } from '../state/SessionContext';
import { OnboardingFlow } from './OnboardingFlow';
import { ParentLandingScreen } from '../screens/ParentLandingScreen';
import { ChildDashboardScreen } from '../screens/ChildDashboardScreen';
import { colors } from '../theme';

/**
 * Top-level router. A returning user with a session and a saved device role goes
 * straight to their home screen; everyone else runs onboarding.
 */
export function AppRouter() {
  const { session, deviceRole, loading } = useSession();

  if (loading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator color={colors.accent} size="large" />
      </SafeAreaView>
    );
  }

  if (session && deviceRole) {
    return deviceRole === 'parent' ? <ParentLandingScreen /> : <ChildDashboardScreen />;
  }

  return <OnboardingFlow />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
