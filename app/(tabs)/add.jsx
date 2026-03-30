import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { apiCall } from '../../constants/api';
import { colors, spacing, radius, font } from '../../constants/theme';

export default function AddSession() {
  const { token } = useAuth();
  const [bookTitle, setBookTitle] = useState('');
  const [duration, setDuration]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const handleSave = async () => {
    if (!bookTitle.trim()) {
      Alert.alert('Missing field', 'Please enter a book title.');
      return;
    }
    if (!duration || Number(duration) < 1) {
      Alert.alert('Invalid duration', 'Please enter a valid number of minutes.');
      return;
    }

    setLoading(true);
    const { ok, data } = await apiCall('/sessions', token, {
      method: 'POST',
      body: JSON.stringify({
        book_title:       bookTitle.trim(),
        duration_minutes: Number(duration),
        session_date:     today,
      }),
    });
    setLoading(false);

    if (ok) {
      setSuccess(true);
      setBookTitle('');
      setDuration('');
      setTimeout(() => {
        setSuccess(false);
        router.push('/(tabs)/history');
      }, 1500);
    } else {
      Alert.alert('Error', data.message || 'Could not save session.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.pageTitle}>Log a Session</Text>
            <Text style={styles.pageSubtitle}>What did you read today?</Text>
          </View>
          <View style={styles.headerIcon}>
            <Text style={{ fontSize: 28 }}>📖</Text>
          </View>
        </View>

        {/* Success banner */}
        {success && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>✅  Session saved successfully!</Text>
          </View>
        )}

        {/* Form card */}
        <View style={styles.card}>
          <Text style={styles.label}>BOOK TITLE</Text>
          <TextInput
            style={styles.input}
            value={bookTitle}
            onChangeText={setBookTitle}
            placeholder="E.G. ATOMIC HABITS"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>DURATION (MINUTES)</Text>
          <TextInput
            style={styles.input}
            value={duration}
            onChangeText={setDuration}
            placeholder="E.G. 30"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />

          <Text style={styles.label}>DATE</Text>
          <View style={styles.dateBox}>
            <Text style={styles.dateIcon}>📅</Text>
            <Text style={styles.dateText}>{today} (today)</Text>
          </View>

          {/* Quick select */}
          <Text style={styles.label}>QUICK SELECT</Text>
          <View style={styles.quickRow}>
            {[10, 15, 20, 30, 45, 60].map((mins) => (
              <TouchableOpacity
                key={mins}
                style={[
                  styles.quickBtn,
                  duration === String(mins) && styles.quickBtnActive,
                ]}
                onPress={() => setDuration(String(mins))}
              >
                <Text style={[
                  styles.quickBtnText,
                  duration === String(mins) && styles.quickBtnTextActive,
                ]}>
                  {mins}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveBtnText}>Save Session</Text>
            }
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content:   { padding: spacing.md, paddingTop: spacing.lg + 16, paddingBottom: spacing.xl },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  pageTitle:    { fontSize: 26, fontWeight: font.bold, color: colors.text },
  pageSubtitle: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBanner: {
    backgroundColor: '#E6F4F1',
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  successText: { fontSize: 15, fontWeight: font.medium, color: colors.primary },
  card: {
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
  },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  dateIcon: { fontSize: 16 },
  dateText: { fontSize: 15, color: colors.textMuted },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.sm,
  },
  quickBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  quickBtnActive:     { backgroundColor: colors.primary, borderColor: colors.primary },
  quickBtnText:       { fontSize: 13, color: colors.textMuted, fontWeight: font.medium },
  quickBtnTextActive: { color: '#fff' },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText:     { color: '#fff', fontSize: 16, fontWeight: font.bold, letterSpacing: 0.5 },
});