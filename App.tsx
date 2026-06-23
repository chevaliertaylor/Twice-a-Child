import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Role = 'parent' | 'child';

/**
 * Twice a Child — entry screen.
 *
 * This is an early scaffold. After account creation + plan selection, the
 * first setup step is choosing which end of the relationship this device is
 * (see docs/PRD.md §5.1). The role-specific flows are stubbed for now.
 */
export default function App() {
  const [role, setRole] = useState<Role | null>(null);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.brand}>Twice a Child</Text>

        {role === null ? (
          <>
            <Text style={styles.prompt}>Who is using this device?</Text>

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => setRole('parent')}
            >
              <Text style={styles.cardTitle}>I'm the parent</Text>
              <Text style={styles.cardSubtitle}>Chat with your family companion</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => setRole('child')}
            >
              <Text style={styles.cardTitle}>I'm the child</Text>
              <Text style={styles.cardSubtitle}>See how your parent is doing</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.prompt}>
              {role === 'parent' ? 'Parent setup' : 'Child setup'} coming next
            </Text>
            <Text style={styles.placeholder}>
              Next: avatar setup
              {role === 'child' ? ', then notification & check-in preferences.' : '.'}
            </Text>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.secondary, pressed && styles.cardPressed]}
              onPress={() => setRole(null)}
            >
              <Text style={styles.secondaryText}>Back</Text>
            </Pressable>
          </>
        )}

        <StatusBar style="auto" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  brand: {
    fontSize: 34,
    fontWeight: '700',
    color: '#3A3A3A',
    marginBottom: 12,
  },
  prompt: {
    fontSize: 22,
    color: '#5A5A5A',
    marginBottom: 8,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  cardSubtitle: {
    fontSize: 17,
    color: '#7A7A7A',
    marginTop: 4,
  },
  placeholder: {
    fontSize: 17,
    color: '#7A7A7A',
    textAlign: 'center',
  },
  secondary: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  secondaryText: {
    fontSize: 18,
    color: '#B5651D',
    fontWeight: '600',
  },
});
