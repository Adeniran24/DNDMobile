import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const FORM_COPY = {
  login: {
    title: 'Üdv újra, kalandor',
    subtitle: 'Lépj be a tábor tüzének melegébe.',
    action: 'Bejelentkezés',
    footnote: 'Nincs fiókod? Regisztrálj lent.',
  },
  register: {
    title: 'Csatlakozz a csapathoz',
    subtitle: 'Hozz létre új hőst és kezdd el a kalandot.',
    action: 'Regisztráció',
    footnote: 'Már van fiókod? Jelentkezz be.',
  },
} as const;

type FormMode = keyof typeof FORM_COPY;

export default function HomeScreen() {
  const [mode, setMode] = useState<FormMode>('login');
  const copy = FORM_COPY[mode];

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.select({ ios: 'padding', android: undefined })}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.kicker}>DnD Campfire</Text>
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>
          </View>

          <View style={styles.toggleRow}>
            {(['login', 'register'] as const).map((option) => (
              <Pressable
                key={option}
                onPress={() => setMode(option)}
                style={[styles.toggleButton, mode === option && styles.toggleButtonActive]}>
                <Text style={[styles.toggleText, mode === option && styles.toggleTextActive]}>
                  {option === 'login' ? 'Bejelentkezés' : 'Regisztráció'}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Email cím</Text>
            <TextInput
              placeholder="kalandor@tavern.com"
              placeholderTextColor="#c4a88a"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Jelszó</Text>
            <TextInput
              placeholder="••••••••"
              placeholderTextColor="#c4a88a"
              style={styles.input}
              secureTextEntry
            />

            {mode === 'register' ? (
              <>
                <Text style={styles.label}>Hős neve</Text>
                <TextInput
                  placeholder="Thorn, az őrző"
                  placeholderTextColor="#c4a88a"
                  style={styles.input}
                />
              </>
            ) : null}

            <Pressable style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>{copy.action}</Text>
            </Pressable>

            <Text style={styles.footnote}>{copy.footnote}</Text>
          </View>

          <View style={styles.emberRow}>
            <View style={styles.ember} />
            <View style={styles.emberSmall} />
            <View style={styles.ember} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1b120b',
  },
  keyboard: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 24,
    gap: 24,
    justifyContent: 'center',
  },
  header: {
    gap: 10,
  },
  kicker: {
    color: '#c68a3a',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 30,
    color: '#f6e6d4',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
    color: '#d4b89a',
    lineHeight: 22,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#2a1a11',
    borderRadius: 18,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#6b3a1e',
  },
  toggleText: {
    color: '#c4a88a',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#fef5eb',
  },
  card: {
    backgroundColor: '#24160e',
    borderRadius: 20,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#3c2616',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  label: {
    color: '#e4c9ad',
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#2f1e14',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f6e6d4',
    borderWidth: 1,
    borderColor: '#4a2f1d',
  },
  primaryButton: {
    backgroundColor: '#c0682a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryButtonText: {
    color: '#fef5eb',
    fontWeight: '700',
    fontSize: 16,
  },
  footnote: {
    color: '#c4a88a',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
  emberRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ember: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#c0682a',
  },
  emberSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6b3a1e',
  },
});
