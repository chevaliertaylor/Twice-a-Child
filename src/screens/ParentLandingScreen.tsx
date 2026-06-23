import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import * as Speech from 'expo-speech';
import * as ImagePicker from 'expo-image-picker';
import { useSession } from '../state/SessionContext';
import { fetchProfile, sendChat, transcribeAudio, uploadPhoto } from '../api/db';
import { PRESET_AVATARS } from '../types';
import { colors, radius, spacing } from '../theme';

interface Bubble {
  id: string;
  sender: 'parent' | 'companion';
  content: string;
}

/**
 * Parent landing page (PRD §6): the child's avatar greets the parent, who can
 * chat with the companion by text or voice. Wired to the `chat` Edge Function;
 * voice is recorded, transcribed via `transcribe`, then sent. Companion replies
 * are read aloud.
 */
export function ParentLandingScreen({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { session } = useSession();
  const [avatarEmoji, setAvatarEmoji] = useState('🙂');
  const [messages, setMessages] = useState<Bubble[]>([
    { id: 'greeting', sender: 'companion', content: 'Morning! How are you feeling today?' },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const conversationId = useRef<string | undefined>(undefined);
  const listRef = useRef<FlatList<Bubble>>(null);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  useEffect(() => {
    if (!session) return;
    // The parent sees the child's avatar.
    fetchProfile(session.user.id, 'child').then((profile) => {
      if (profile?.avatar_kind === 'preset' && profile.avatar_ref) {
        const preset = PRESET_AVATARS.find((a) => a.id === profile.avatar_ref);
        if (preset) setAvatarEmoji(preset.emoji);
      }
    });
  }, [session]);

  const submitMessage = async (text: string, modality: 'text' | 'voice') => {
    if (!text || sending) return;
    setMessages((m) => [...m, { id: `p-${Date.now()}`, sender: 'parent', content: text }]);
    setSending(true);
    try {
      const res = await sendChat({ conversationId: conversationId.current, message: text, modality });
      conversationId.current = res.conversationId;
      setMessages((m) => [...m, { id: `c-${Date.now()}`, sender: 'companion', content: res.reply }]);
      Speech.speak(res.reply);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: `e-${Date.now()}`,
          sender: 'companion',
          content: "I couldn't reach the network just now — let's try again in a moment.",
        },
      ]);
    } finally {
      setSending(false);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  };

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    void submitMessage(text, 'text');
  };

  const handlePhoto = async () => {
    if (!session) return;
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        base64: true,
        quality: 0.6,
      });
      if (res.canceled) return;
      const asset = res.assets[0];
      if (!asset?.base64) return;
      await uploadPhoto(session.user.id, 'parent', asset.base64);
      setMessages((m) => [
        ...m,
        { id: `ph-${Date.now()}`, sender: 'parent', content: '📷 Photo sent to your family' },
      ]);
    } catch {
      // ignore (cancelled / network)
    }
  };

  const startRecording = async () => {
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) return;
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecording(true);
    } catch {
      setRecording(false);
    }
  };

  const stopRecording = async () => {
    setRecording(false);
    setTranscribing(true);
    let transcript = '';
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (uri) {
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
        transcript = (await transcribeAudio(base64, 'audio/m4a')).trim();
      }
    } catch {
      transcript = '';
    } finally {
      setTranscribing(false);
    }
    if (transcript) await submitMessage(transcript, 'voice');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send a photo to your family"
            onPress={handlePhoto}
            style={styles.photoButton}
          >
            <Text style={styles.settingsIcon}>📷</Text>
          </Pressable>
          <View style={styles.avatarBubble}>
            <Text style={styles.avatarEmoji}>{avatarEmoji}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Settings"
            onPress={onOpenSettings}
            style={styles.settingsButton}
          >
            <Text style={styles.settingsIcon}>⚙︎</Text>
          </Pressable>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.sender === 'parent' ? styles.bubbleParent : styles.bubbleCompanion,
              ]}
            >
              <Text style={styles.bubbleText}>{item.content}</Text>
            </View>
          )}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.composer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={recording ? 'Stop recording' : 'Record a voice message'}
            onPress={recording ? stopRecording : startRecording}
            disabled={sending || transcribing}
            style={({ pressed }) => [
              styles.micButton,
              recording && styles.micRecording,
              (sending || transcribing) && styles.sendDisabled,
              pressed && styles.pressed,
            ]}
          >
            {transcribing ? (
              <ActivityIndicator color={colors.accent} />
            ) : (
              <Text style={styles.micIcon}>{recording ? '■' : '🎤'}</Text>
            )}
          </Pressable>

          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={recording ? 'Listening…' : 'Tap to type…'}
            placeholderTextColor={colors.textMuted}
            editable={!recording}
            multiline
            onSubmitEditing={send}
          />
          <Pressable
            accessibilityRole="button"
            onPress={send}
            disabled={sending || input.trim().length === 0}
            style={({ pressed }) => [
              styles.sendButton,
              (sending || input.trim().length === 0) && styles.sendDisabled,
              pressed && styles.pressed,
            ]}
          >
            {sending ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.sendLabel}>Send</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: { alignItems: 'center', paddingTop: spacing.md },
  settingsButton: { position: 'absolute', right: spacing.md, top: spacing.md, padding: spacing.sm },
  photoButton: { position: 'absolute', left: spacing.md, top: spacing.md, padding: spacing.sm },
  settingsIcon: { fontSize: 24, color: colors.textSecondary },
  avatarBubble: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  avatarEmoji: { fontSize: 52 },
  list: { padding: spacing.md, gap: spacing.sm },
  bubble: {
    maxWidth: '82%',
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  bubbleCompanion: { alignSelf: 'flex-start', backgroundColor: colors.surface },
  bubbleParent: { alignSelf: 'flex-end', backgroundColor: colors.accentSoft },
  bubbleText: { fontSize: 18, color: colors.textPrimary, lineHeight: 24 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: 18,
    color: colors.textPrimary,
  },
  sendButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.4 },
  sendLabel: { color: colors.surface, fontSize: 17, fontWeight: '600' },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micRecording: { backgroundColor: '#FBE9EB', borderColor: colors.danger },
  micIcon: { fontSize: 20 },
  pressed: { opacity: 0.85 },
});
