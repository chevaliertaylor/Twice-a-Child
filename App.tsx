import { StatusBar } from 'expo-status-bar';
import { OnboardingProvider } from './src/state/OnboardingContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <OnboardingProvider>
      <RootNavigator />
      <StatusBar style="dark" />
    </OnboardingProvider>
  );
}
