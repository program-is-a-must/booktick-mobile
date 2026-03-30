import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Alert, RefreshControl,
  ActivityIndicator, TextInput
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { apiCall } from '../../constants/api';
import { colors, spacing, radius, font } from '../../constants/theme';

interface AdminUser {
  id:                     number;
  name:                   string;
  email:                  string;
  role:                   string;
  is_banned:              boolean;
  reading_sessions_count: number;
}

interface AdminStats {
  total_users:    number;
  total_sessions: number;
  total_minutes:  number;
  banned_users:   number;
}

interface Challenge {
  title:          string;
  daily_minutes:  string;
  start_date:     string;
  end_date:       string;
}

const EMPTY_CHALLENGE: Challenge = {
  title: '', daily_minutes: '', start_date: '', end_date: '',
};

export default function AdminPanel() {
  const { token } = useAuth();
  const [tab, setTab]               = useState<'stats' | 'users' | 'challenge'>('stats');
  const [stats, setStats]           = useState<AdminStats | null>(null);
  const [users, setUsers]           = useState<AdminUser[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [challenge, setChallenge]   = useState<Challenge>(EMPTY_CHALLENGE);
  const [saving, setSaving]         = useState(false);

  const fetchAll = async () => {
    const [statsRes, usersRes] = await Promise.all([
      apiCall('/admin/stats', token),
      apiCall('/admin/users', token),
    ]);
    if (statsRes.ok) setStats(statsRes.data);
    if (usersRes.ok) setUsers(usersRes.data);
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => { fetchAll(); }, [token]));

  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  const handleToggleBan = (user: AdminUser) => {
    const action = user.is_banned ? 'unban' : 'ban';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} user`,
      `Are you sure you want to ${action} ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: user.is_banned ? 'default' : 'destructive',
          onPress: async () => {
            const { ok, data } = await apiCall(
              `/admin/users/${user.id}/toggle-ban`, token, { method: 'PATCH' }
            );
            if (ok) {
              setUsers(prev =>
                prev.map(u => u.id === user.id ? { ...u, is_banned: data.is_banned } : u)
              );
            } else {
              Alert.alert('Error', data.message || 'Something went wrong.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteUser = (user: AdminUser) => {
    Alert.alert(
      'Delete user',
      `This will permanently delete ${user.name} and all their data. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete permanently',
          style: 'destructive',
          onPress: async () => {
            const { ok } = await apiCall(`/admin/users/${user.id}`, token, { method: 'DELETE' });
            if (ok) {
              setUsers(prev => prev.filter(u => u.id !== user.id));
            } else {
              Alert.alert('Error', 'Could not delete user.');
            }
          },
        },
      ]
    );
  };

  const handleCreateChallenge = async () => {
    if (!challenge.title || !challenge.daily_minutes || !challenge.start_date || !challenge.end_date) {
      Alert.alert('Missing fields', 'Please fill in all challenge fields.');
      return;
    }
    setSaving(true);
    const { ok, data } = await apiCall('/admin/challenges', token, {
      method: 'POST',
      body: JSON.stringify({
        title:          challenge.title,
        daily_minutes:  Number(challenge.daily_minutes),
        start_date:     challenge.start_date,
        end_date:       challenge.end_date,
        is_active:      true,
      }),
    });
    setSaving(false);
    if (ok) {
      Alert.alert('✅ Challenge created!', `"${data.title}" is now live.`);
      setChallenge(EMPTY_CHALLENGE);
    } else {
      Alert.alert('Error', data.message || 'Could not create challenge.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Admin Panel</Text>
        <Text style={styles.pageSubtitle}>Super admin view 🔐</Text>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        {(['stats', 'users', 'challenge'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>
              {t === 'stats' ? 'Stats' : t === 'users' ? 'Users' : 'Challenge'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* ── STATS TAB ── */}
        {tab === 'stats' && stats && (
          <View style={styles.section}>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: colors.blue }]}>
                <Text style={styles.statValue}>{stats.total_users}</Text>
                <Text style={styles.statLabel}>Total Users</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.orange }]}>
                <Text style={styles.statValue}>{stats.total_sessions}</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.purple }]}>
                <Text style={styles.statValue}>{Math.round(stats.total_minutes / 60)}h</Text>
                <Text style={styles.statLabel}>Total Hours</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.danger }]}>
                <Text style={styles.statValue}>{stats.banned_users}</Text>
                <Text style={styles.statLabel}>Banned</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── USERS TAB ── */}
        {tab === 'users' && (
          <View style={styles.section}>
            {users.map((user) => (
              <View key={user.id} style={[styles.userCard, user.is_banned && styles.userCardBanned]}>
                <View style={styles.userLeft}>
                  <View style={[styles.userAvatar, { backgroundColor: user.is_banned ? colors.danger : colors.primary }]}>
                    <Text style={styles.userAvatarText}>
                      {user.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    <Text style={styles.userMeta}>
                      {user.reading_sessions_count} sessions · {user.role}
                      {user.is_banned ? ' · 🚫 banned' : ''}
                    </Text>
                  </View>
                </View>
                <View style={styles.userActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, user.is_banned ? styles.unbanBtn : styles.banBtn]}
                    onPress={() => handleToggleBan(user)}
                  >
                    <Text style={styles.actionBtnText}>
                      {user.is_banned ? 'Unban' : 'Ban'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteUser(user)}
                  >
                    <Text style={styles.deleteBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── CHALLENGE TAB ── */}
        {tab === 'challenge' && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Create New Challenge</Text>

              <Text style={styles.label}>CHALLENGE TITLE</Text>
              <TextInput
                style={styles.input}
                value={challenge.title}
                onChangeText={(v) => setChallenge(p => ({ ...p, title: v }))}
                placeholder="E.G. READ 15 MINS DAILY"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.label}>DAILY MINUTES REQUIRED</Text>
              <TextInput
                style={styles.input}
                value={challenge.daily_minutes}
                onChangeText={(v) => setChallenge(p => ({ ...p, daily_minutes: v }))}
                placeholder="E.G. 15"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />

              <Text style={styles.label}>START DATE (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={challenge.start_date}
                onChangeText={(v) => setChallenge(p => ({ ...p, start_date: v }))}
                placeholder="E.G. 2026-04-01"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.label}>END DATE (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={challenge.end_date}
                onChangeText={(v) => setChallenge(p => ({ ...p, end_date: v }))}
                placeholder="E.G. 2026-04-30"
                placeholderTextColor={colors.textMuted}
              />

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleCreateChallenge}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.saveBtnText}>Create Challenge</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.background },
  centered:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg + 16,
    paddingBottom: spacing.md,
  },
  pageTitle:    { fontSize: 26, fontWeight: font.bold, color: colors.text },
  pageSubtitle: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radius.sm - 2,
    alignItems: 'center',
  },
  tabBtnActive:     { backgroundColor: colors.primary },
  tabBtnText:       { fontSize: 13, fontWeight: font.medium, color: colors.textMuted },
  tabBtnTextActive: { color: '#fff', fontWeight: font.bold },
  scroll:           { flex: 1 },
  scrollContent:    { padding: spacing.md, paddingBottom: spacing.xl },
  section:          { gap: spacing.sm },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    width: '47.5%',
    borderRadius: radius.lg,
    padding: spacing.md,
    minHeight: 100,
    justifyContent: 'flex-end',
  },
  statValue: { fontSize: 32, fontWeight: font.bold, color: '#fff' },
  statLabel: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: font.medium },
  userCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },
  userCardBanned: { borderColor: '#FFD0D0', backgroundColor: '#FFF5F5' },
  userLeft:       { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: { fontSize: 18, fontWeight: font.bold, color: '#fff' },
  userInfo:       { flex: 1 },
  userName:       { fontSize: 15, fontWeight: font.bold, color: colors.text },
  userEmail:      { fontSize: 12, color: colors.textMuted },
  userMeta:       { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  userActions:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  banBtn:         { backgroundColor: '#FFF0F0', borderWidth: 1, borderColor: colors.danger },
  unbanBtn:       { backgroundColor: '#EAF4F2', borderWidth: 1, borderColor: colors.primary },
  actionBtnText:  { fontSize: 12, fontWeight: font.bold, color: colors.text },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFE0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: { fontSize: 12, color: colors.danger, fontWeight: font.bold },
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
  cardTitle: { fontSize: 18, fontWeight: font.bold, color: colors.text, marginBottom: spacing.md },
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
  saveBtn:         { backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: 16, alignItems: 'center', marginTop: spacing.md },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText:     { color: '#fff', fontSize: 16, fontWeight: font.bold, letterSpacing: 0.5 },
});
