import { useCallback, useState } from 'react';
import { useOnboarding } from '../state/OnboardingContext';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { PlanScreen } from '../screens/PlanScreen';
import { RoleScreen } from '../screens/RoleScreen';
import { AvatarScreen } from '../screens/AvatarScreen';
import { ChildPreferencesScreen } from '../screens/ChildPreferencesScreen';
import { ParentLandingScreen } from '../screens/ParentLandingScreen';
import { ChildDashboardScreen } from '../screens/ChildDashboardScreen';

type Step =
  | 'welcome'
  | 'signup'
  | 'plan'
  | 'role'
  | 'avatar'
  | 'childPrefs'
  | 'parentHome'
  | 'childHome';

/**
 * Lightweight linear navigator for the onboarding flow. A real navigation
 * library (e.g. React Navigation) can replace this once native module versions
 * are pinned for EAS builds; the screen components stay unchanged.
 */
export function RootNavigator() {
  const { data } = useOnboarding();
  const [history, setHistory] = useState<Step[]>(['welcome']);
  const current = history[history.length - 1];

  const nextOf = useCallback(
    (step: Step): Step => {
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
          return data.role === 'child' ? 'childPrefs' : 'parentHome';
        case 'childPrefs':
          return 'childHome';
        default:
          return step;
      }
    },
    [data.role],
  );

  const goNext = useCallback(() => {
    setHistory((h) => [...h, nextOf(h[h.length - 1])]);
  }, [nextOf]);

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
    case 'parentHome':
      return <ParentLandingScreen />;
    case 'childHome':
      return <ChildDashboardScreen />;
    default:
      return <WelcomeScreen onNext={goNext} />;
  }
}
