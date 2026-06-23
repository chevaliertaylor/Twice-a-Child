import { useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';
import { useSession } from '../state/SessionContext';
import { usePushRegistration } from '../hooks/usePushRegistration';
import { OnboardingFlow } from './OnboardingFlow';
import { ParentLandingScreen } from '../screens/ParentLandingScreen';
import { ChildDashboardScreen } from '../screens/ChildDashboardScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { colors } from '../theme';

type AuthedView = 'home' | 'settings';

/**
 * Top-level router. A returning user with a session and a saved device role goes
 * straight to their home screen; everyone else runs onboarding. Within the
 * authenticated area, a small view toggle covers Settings.
 */
export function AppRouter() {
  const { session, deviceRole, loading } = useSession();
  const [view, setView] = useState<AuthedView>('home');

  usePushRegistration(session, deviceRole);

  if (loading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator color={colors.accent} size="large" />
      </SafeAreaView>
    );
  }

  if (session && deviceRole) {
    if (view === 'settings') {
      return <SettingsScreen onBack={() => setView('home')} />;
    }
    const openSettings = () => setView('settings');
    return deviceRole === 'parent' ? (
      <ParentLandingScreen onOpenSettings={openSettings} />
    ) : (
      <ChildDashboardScreen onOpenSettings={openSettings} />
    );
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
