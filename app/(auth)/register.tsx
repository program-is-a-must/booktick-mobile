import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing, radius, font } from '../../constants/theme';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { ok, data } = await register(name.trim(), email.trim(), password);
    setLoading(false);
    if (!ok) Alert.alert('Registration failed', data.message || 'Something went wrong.');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">

        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>📖</Text>
          </View>
        </View>

        <Text style={styles.appName}>Book Tick</Text>
        <Text style={styles.tagline}>Create your account.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>FULL NAME</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="E.G. MISHAEL"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
          />

          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="E.G. YOU@EMAIL.COM"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="MIN. 6 CHARACTERS"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Create Account</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.link} onPress={() => router.back()}>
            <Text style={styles.linkText}>
              Already registered? <Text style={styles.linkBold}>Log in</Text>
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.background },
  inner: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  logoWrap:   { marginBottom: spacing.md },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji:  { fontSize: 40 },
  appName: {
    fontSize: 32,
    fontWeight: font.bold,
    color: colors.primary,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  tagline:    { fontSize: 15, color: colors.textMuted, marginBottom: spacing.xl },
  card: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: font.bold,
    color: colors.primary,
    letterSpacing: 1.2,
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  button:         { backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: 16, alignItems: 'center', marginTop: spacing.md },
  buttonDisabled: { opacity: 0.6 },
  buttonText:     { color: '#fff', fontSize: 16, fontWeight: font.bold, letterSpacing: 0.5 },
  link:           { marginTop: spacing.md, alignItems: 'center' },
  linkText:       { fontSize: 14, color: colors.textMuted },
  linkBold:       { color: colors.primary, fontWeight: font.bold },
});