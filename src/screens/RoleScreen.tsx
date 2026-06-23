import { useState } from 'react';
import { ScreenContainer } from '../components/ScreenContainer';
import { PrimaryButton } from '../components/PrimaryButton';
import { SelectableCard } from '../components/SelectableCard';
import { useOnboarding } from '../state/OnboardingContext';
import type { Role } from '../types';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export function RoleScreen({ onNext, onBack }: Props) {
  const { update } = useOnboarding();
  const [role, setRole] = useState<Role | null>(null);

  const handleContinue = () => {
    if (!role) return;
    update({ role });
    onNext();
  };

  return (
    <ScreenContainer
      title="Who is using this device?"
      subtitle="You can set up the other device with the same login."
      onBack={onBack}
      footer={<PrimaryButton label="Continue" onPress={handleContinue} disabled={!role} />}
    >
      <SelectableCard
        title="I'm the parent"
        subtitle="Chat with your family companion."
        leading="🏡"
        selected={role === 'parent'}
        onPress={() => setRole('parent')}
      />
      <SelectableCard
        title="I'm the child"
        subtitle="See how your parent is doing."
        leading="📱"
        selected={role === 'child'}
        onPress={() => setRole('child')}
      />
    </ScreenContainer>
  );
}
