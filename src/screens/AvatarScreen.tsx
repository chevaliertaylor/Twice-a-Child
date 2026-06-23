import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { PrimaryButton } from '../components/PrimaryButton';
import { useOnboarding } from '../state/OnboardingContext';
import { PRESET_AVATARS, type AvatarSelection } from '../types';
import { colors, radius, spacing } from '../theme';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

export function AvatarScreen({ onNext, onBack }: Props) {
  const { data, update } = useOnboarding();
  const [selection, setSelection] = useState<AvatarSelection | null>(null);

  const isParent = data.role === 'parent';
  const who = isParent ? 'you' : 'you';

  // Photo upload is stubbed until the image picker + avatar generation are wired up.
  const handleUploadPhoto = () => {
    setSelection({ kind: 'photo', uri: 'pending://photo' });
  };

  const handleContinue = () => {
    if (!selection) return;
    update({ avatar: selection });
    onNext();
  };

  return (
    <ScreenContainer
      title="Choose an avatar"
      subtitle={`Upload a photo to create a friendly avatar of ${who}, or pick one below.`}
      onBack={onBack}
      footer={<PrimaryButton label="Continue" onPress={handleContinue} disabled={!selection} />}
    >
      <Pressable
        accessibilityRole="button"
        onPress={handleUploadPhoto}
        style={({ pressed }) => [
          styles.upload,
          selection?.kind === 'photo' && styles.uploadSelected,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.uploadEmoji}>📷</Text>
        <Text style={styles.uploadLabel}>
          {selection?.kind === 'photo' ? 'Photo selected' : 'Upload a photo'}
        </Text>
        <Text style={styles.uploadHint}>We'll turn it into a warm, friendly avatar.</Text>
      </Pressable>

      <Text style={styles.or}>or choose one</Text>

      <View style={styles.grid}>
        {PRESET_AVATARS.map((preset) => {
          const selected = selection?.kind === 'preset' && selection.id === preset.id;
          return (
            <Pressable
              key={preset.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setSelection({ kind: 'preset', id: preset.id })}
              style={({ pressed }) => [
                styles.preset,
                selected && styles.presetSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.presetEmoji}>{preset.emoji}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  upload: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  uploadSelected: {
    borderColor: colors.accent,
  },
  uploadEmoji: {
    fontSize: 34,
  },
  uploadLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  uploadHint: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  or: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  preset: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetSelected: {
    borderColor: colors.accent,
  },
  presetEmoji: {
    fontSize: 32,
  },
  pressed: {
    opacity: 0.85,
  },
});
