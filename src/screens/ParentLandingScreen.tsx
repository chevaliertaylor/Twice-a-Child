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
import { useSession } from '../state/SessionContext';
import { fetchProfile, sendChat } from '../api/db';
import { PRESET_AVATARS } from '../types';
import { colors, radius, spacing } from '../theme';

interface Bubble {
  id: string;
  sender: 'parent' | 'companion';
  content: string;
}

/**
 * Parent landing page (PRD §6): the child's avatar greets the parent, who can
 * chat with the companion. Wired to the `chat` Edge Function. Voice input is a
 * later slice — text only for now.
 */
export function ParentLandingScreen() {
  const { session } = useSession();
  const [avatarEmoji, setAvatarEmoji] = useState('🙂');
  const [messages, setMessages] = useState<Bubble[]>([
    { id: 'greeting', sender: 'companion', content: 'Morning! How are you feeling today?' },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const conversationId = useRef<string | undefined>(undefined);
  const listRef = useRef<FlatList<Bubble>>(null);

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

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    const parentBubble: Bubble = { id: `p-${Date.now()}`, sender: 'parent', content: text };
    setMessages((m) => [...m, parentBubble]);
    setSending(true);
    try {
      const res = await sendChat({ conversationId: conversationId.current, message: text });
      conversationId.current = res.conversationId;
      setMessages((m) => [...m, { id: `c-${Date.now()}`, sender: 'companion', content: res.reply }]);
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

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <View style={styles.avatarBubble}>
            <Text style={styles.avatarEmoji}>{avatarEmoji}</Text>
          </View>
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
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Tap to type…"
            placeholderTextColor={colors.textMuted}
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
  pressed: { opacity: 0.85 },
});
