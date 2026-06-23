import { useState } from 'react';
import { ScreenContainer } from '../components/ScreenContainer';
import { PrimaryButton } from '../components/PrimaryButton';
import { SelectableCard } from '../components/SelectableCard';
import { useOnboarding } from '../state/OnboardingContext';
import type { PlanChoice } from '../types';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export function PlanScreen({ onNext, onBack }: Props) {
  const { update } = useOnboarding();
  const [plan, setPlan] = useState<PlanChoice | null>(null);

  const handleContinue = () => {
    if (!plan) return;
    update({ plan });
    onNext();
  };

  return (
    <ScreenContainer
      title="Choose your plan"
      subtitle="$5.99 / month. Cancel anytime."
      onBack={onBack}
      footer={<PrimaryButton label="Continue" onPress={handleContinue} disabled={!plan} />}
    >
      <SelectableCard
        title="Start 7-day free trial"
        subtitle="Then $5.99/month. We'll remind you before it renews."
        leading="✨"
        selected={plan === 'trial'}
        onPress={() => setPlan('trial')}
      />
      <SelectableCard
        title="Subscribe now"
        subtitle="$5.99/month, billed through the App Store."
        leading="💳"
        selected={plan === 'subscribe'}
        onPress={() => setPlan('subscribe')}
      />
    </ScreenContainer>
  );
}
