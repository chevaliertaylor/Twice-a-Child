import { useCallback, useState } from 'react';
import { useOnboarding } from '../state/OnboardingContext';
import { useSession } from '../state/SessionContext';
import { saveOnboarding } from '../api/db';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { PlanScreen } from '../screens/PlanScreen';
import { RoleScreen } from '../screens/RoleScreen';
import { AvatarScreen } from '../screens/AvatarScreen';
import { ChildPreferencesScreen } from '../screens/ChildPreferencesScreen';

type Step = 'welcome' | 'signup' | 'plan' | 'role' | 'avatar' | 'childPrefs';

/**
 * Linear onboarding flow. Completing the final step persists the collected data
 * and sets the device role — which flips the app over to the home screen via
 * AppRouter. (A real navigation library can replace this; the screens are
 * unchanged.)
 */
export function OnboardingFlow() {
  const { data } = useOnboarding();
  const { session, setDeviceRole } = useSession();
  const [history, setHistory] = useState<Step[]>(['welcome']);
  const [completing, setCompleting] = useState(false);
  const current = history[history.length - 1];

  const nextOf = useCallback((step: Step): Step => {
    switch (step) {
      case 'welcome':
        return 'signup';
      case 'signup':
        return 'plan';
      case 'plan':
        return 'role';
      case 'role':
        return 'avatar';
      case 'avatar':
        return 'childPrefs';
      default:
        return step;
    }
  }, []);

  // The last step depends on role: parents finish at avatar, children at prefs.
  const isTerminal = (step: Step) => (step === 'avatar' ? data.role !== 'child' : step === 'childPrefs');

  const complete = useCallback(async () => {
    if (!session || !data.role || completing) return;
    setCompleting(true);
    try {
      await saveOnboarding(session.user.id, data);
      await setDeviceRole(data.role); // AppRouter swaps to home once this is set
    } catch (e) {
      console.warn('Onboarding persist failed', e);
      setCompleting(false);
    }
  }, [session, data, completing, setDeviceRole]);

  const goNext = useCallback(() => {
    if (isTerminal(current)) {
      void complete();
      return;
    }
    setHistory((h) => [...h, nextOf(h[h.length - 1])]);
  }, [current, complete, nextOf, data.role]);

  const goBack = useCallback(() => {
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h));
  }, []);

  switch (current) {
    case 'welcome':
      return <WelcomeScreen onNext={goNext} />;
    case 'signup':
      return <SignUpScreen onNext={goNext} onBack={goBack} />;
    case 'plan':
      return <PlanScreen onNext={goNext} onBack={goBack} />;
    case 'role':
      return <RoleScreen onNext={goNext} onBack={goBack} />;
    case 'avatar':
      return <AvatarScreen onNext={goNext} onBack={goBack} />;
    case 'childPrefs':
      return <ChildPreferencesScreen onNext={goNext} onBack={goBack} />;
    default:
      return <WelcomeScreen onNext={goNext} />;
  }
}
