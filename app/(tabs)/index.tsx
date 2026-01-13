import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import * as Crypto from 'expo-crypto';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5000';

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

type StatusMessage = {
  type: 'error' | 'success';
  text: string;
} | null;

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

const hashPassword = async (password: string, salt: string) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${password}${salt}`);

const generateSalt = async () => {
  const bytes = await Crypto.getRandomBytesAsync(16);
  return toHex(bytes);
};

const buildUrl = (path: string, params?: Record<string, string>) => {
  const url = new URL(path, API_BASE_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return url.toString();
};

export default function HomeScreen() {
  const [mode, setMode] = useState<FormMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [heroName, setHeroName] = useState('');
  const [status, setStatus] = useState<StatusMessage>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [token, setToken] = useState('');

  const copy = FORM_COPY[mode];
  const sanitizedEmail = useMemo(() => email.trim(), [email]);

  const resetStatus = () => setStatus(null);

  const handleRegister = async () => {
    if (!sanitizedEmail || !password || !heroName.trim()) {
      setStatus({ type: 'error', text: 'Minden mező kitöltése kötelező.' });
      return;
    }

    setIsSubmitting(true);
    resetStatus();

    try {
      const salt = await generateSalt();
      const clientHash = await hashPassword(password, salt);
      const registerResponse = await fetch(
        buildUrl('/api/auth/register', {
          email: sanitizedEmail,
          username: heroName.trim(),
          password: clientHash,
        }),
        { method: 'POST' }
      );

      if (!registerResponse.ok) {
        const errorText = await registerResponse.text();
        throw new Error(errorText || 'Sikertelen regisztráció.');
      }

      const saltResponse = await fetch(buildUrl('/api/auth/salt-send'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: sanitizedEmail, salt }),
      });

      if (!saltResponse.ok) {
        const errorText = await saltResponse.text();
        throw new Error(errorText || 'Nem sikerült a só mentése.');
      }

      setStatus({ type: 'success', text: 'Sikeres regisztráció! Most jelentkezz be.' });
      setMode('login');
      setPassword('');
    } catch (error) {
      setStatus({
        type: 'error',
        text: error instanceof Error ? error.message : 'Ismeretlen hiba történt.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async () => {
    if (!sanitizedEmail || !password) {
      setStatus({ type: 'error', text: 'Email és jelszó megadása kötelező.' });
      return;
    }

    setIsSubmitting(true);
    resetStatus();

    try {
      const saltResponse = await fetch(buildUrl('/api/auth/salt', { email: sanitizedEmail }));
      if (!saltResponse.ok) {
        const errorText = await saltResponse.text();
        throw new Error(errorText || 'Nem található a felhasználó.');
      }

      const saltPayload = (await saltResponse.json()) as { salt: string };
      const clientHash = await hashPassword(password, saltPayload.salt);
      const loginResponse = await fetch(
        buildUrl('/api/auth/login', { email: sanitizedEmail, password: clientHash }),
        { method: 'POST' }
      );

      if (!loginResponse.ok) {
        const errorText = await loginResponse.text();
        throw new Error(errorText || 'Hibás bejelentkezés.');
      }

      const payload = (await loginResponse.json()) as { token: string };
      setToken(payload.token ?? '');
      setStatus({ type: 'success', text: 'Sikeres bejelentkezés!' });
      setPassword('');
    } catch (error) {
      setStatus({
        type: 'error',
        text: error instanceof Error ? error.message : 'Ismeretlen hiba történt.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (isSubmitting) {
      return;
    }

    if (mode === 'login') {
      void handleLogin();
    } else {
      void handleRegister();
    }
  };

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
                onPress={() => {
                  resetStatus();
                  setMode(option);
                }}
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
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              editable={!isSubmitting}
            />

            <Text style={styles.label}>Jelszó</Text>
            <TextInput
              placeholder="••••••••"
              placeholderTextColor="#c4a88a"
              style={styles.input}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!isSubmitting}
            />

            {mode === 'register' ? (
              <>
                <Text style={styles.label}>Hős neve</Text>
                <TextInput
                  placeholder="Thorn, az őrző"
                  placeholderTextColor="#c4a88a"
                  style={styles.input}
                  value={heroName}
                  onChangeText={setHeroName}
                  editable={!isSubmitting}
                />
              </>
            ) : null}

            {status ? (
              <Text
                style={[
                  styles.statusText,
                  status.type === 'error' ? styles.statusError : styles.statusSuccess,
                ]}>
                {status.text}
              </Text>
            ) : null}

            {token ? <Text style={styles.tokenText}>JWT: {token}</Text> : null}

            <Pressable
              style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
              onPress={handleSubmit}>
              {isSubmitting ? (
                <ActivityIndicator color="#fef5eb" />
              ) : (
                <Text style={styles.primaryButtonText}>{copy.action}</Text>
              )}
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
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusError: {
    color: '#f2a07a',
  },
  statusSuccess: {
    color: '#f7d9b8',
  },
  tokenText: {
    fontSize: 10,
    color: '#c4a88a',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#c0682a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
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
