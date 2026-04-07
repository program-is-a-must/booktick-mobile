import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl, TouchableOpacity
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { getAdminOverview } from '../../lib/firestore';

export default function AdminOverview() {
  const { logout, loading: authLoading } = useAuth();
  const [data, setData]             = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOverview = async () => {
    try {
      const res = await getAdminOverview();
      setData(res);
    } catch (error) {
      console.error('Error fetching overview:', error);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => {
    if (!authLoading) fetchOverview();
  }, [authLoading]));

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchOverview(); }}
          tintColor="#3B82F6"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>Overview 📊</Text>
          <Text style={styles.pageSubtitle}>Book Tick Admin Panel</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Stat cards */}
      <View style={styles.grid}>
        <View style={[styles.statCard, { backgroundColor: '#3B82F6' }]}>
          <Text style={styles.statIcon}>👥</Text>
          <Text style={styles.statValue}>{data?.total_users ?? 0}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#10B981' }]}>
          <Text style={styles.statIcon}>📖</Text>
          <Text style={styles.statValue}>{data?.total_sessions ?? 0}</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#8B5CF6' }]}>
          <Text style={styles.statIcon}>⏱</Text>
          <Text style={styles.statValue}>{data?.total_hours ?? 0}</Text>
          <Text style={styles.statLabel}>Total Hours</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#EF4444' }]}>
          <Text style={styles.statIcon}>🚫</Text>
          <Text style={styles.statValue}>{data?.banned_users ?? 0}</Text>
          <Text style={styles.statLabel}>Banned</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#F59E0B' }]}>
          <Text style={styles.statIcon}>📅</Text>
          <Text style={styles.statValue}>{data?.active_today ?? 0}</Text>
          <Text style={styles.statLabel}>Active Today</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#06B6D4' }]}>
          <Text style={styles.statIcon}>🕐</Text>
          <Text style={styles.statValue}>{data?.total_minutes ?? 0}</Text>
          <Text style={styles.statLabel}>Total Mins</Text>
        </View>
      </View>

      {/* Top readers */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏅 TOP READERS THIS WEEK</Text>

        {(!data?.top_readers || data.top_readers.length === 0) && (
          <Text style={styles.emptyText}>No reading sessions this week yet.</Text>
        )}

        {data?.top_readers?.map((reader: any, index: number) => (
          <View key={reader.id} style={styles.readerRow}>
            <View style={styles.readerRank}>
              <Text style={styles.readerRankText}>#{index + 1}</Text>
            </View>
            <View style={styles.readerInfo}>
              <Text style={styles.readerName}>{reader.name}</Text>
              <Text style={styles.readerEmail}>{reader.email}</Text>
            </View>
            <Text style={styles.readerMins}>
              {reader.reading_sessions_sum_duration_minutes ?? 0} min
            </Text>
          </View>
        ))}
      </View>

      {/* Quick nav */}
      <View style={styles.quickNav}>
        <TouchableOpacity
          style={styles.quickNavBtn}
          onPress={() => router.push('/(admin)/users')}
        >
          <Text style={styles.quickNavIcon}>👥</Text>
          <Text style={styles.quickNavText}>Manage Users</Text>
          <Text style={styles.quickNavArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickNavBtn}
          onPress={() => router.push('/(admin)/challenges')}
        >
          <Text style={styles.quickNavIcon}>🏆</Text>
          <Text style={styles.quickNavText}>Manage Challenges</Text>
          <Text style={styles.quickNavArrow}>→</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0F1A2E' },
  content:      { padding: 16, paddingTop: 56, paddingBottom: 32 },
  centered:     { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F1A2E' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  pageTitle:    { fontSize: 24, fontWeight: '700', color: '#fff' },
  pageSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  logoutBtn: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  logoutText: { fontSize: 13, color: '#EF4444', fontWeight: '600' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    width: '30.5%',
    borderRadius: 14,
    padding: 14,
    minHeight: 100,
    justifyContent: 'flex-end',
  },
  statIcon:  { fontSize: 22, marginBottom: 6 },
  statValue: { fontSize: 24, fontWeight: '700', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  section: {
    backgroundColor: '#1A2E4A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B9FD4',
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    paddingVertical: 12,
  },
  readerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  readerRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(59,130,246,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readerRankText: { fontSize: 13, fontWeight: '700', color: '#3B82F6' },
  readerInfo:     { flex: 1 },
  readerName:     { fontSize: 14, fontWeight: '600', color: '#fff' },
  readerEmail:    { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  readerMins:     { fontSize: 14, fontWeight: '700', color: '#10B981' },
  quickNav: {
    gap: 10,
  },
  quickNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2E4A',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 12,
  },
  quickNavIcon:  { fontSize: 22 },
  quickNavText:  { flex: 1, fontSize: 15, fontWeight: '600', color: '#fff' },
  quickNavArrow: { fontSize: 18, color: 'rgba(255,255,255,0.3)' },
});