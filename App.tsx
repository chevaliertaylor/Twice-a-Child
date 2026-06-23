import { StatusBar } from 'expo-status-bar';
import { SessionProvider } from './src/state/SessionContext';
import { OnboardingProvider } from './src/state/OnboardingContext';
import { AppRouter } from './src/navigation/AppRouter';

export default function App() {
  return (
    <SessionProvider>
      <OnboardingProvider>
        <AppRouter />
        <StatusBar style="dark" />
      </OnboardingProvider>
    </SessionProvider>
  );
}
