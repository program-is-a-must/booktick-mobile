import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  RefreshControl, ActivityIndicator
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { getUserStats, getChallenges } from '../../lib/firestore';
import StatCard from '../../components/StatCard';
import { colors, spacing, radius, font } from '../../constants/theme';

export default function Dashboard() {
  const { firebaseUser, loading: authLoading } = useAuth();
  const [stats, setStats]           = useState<any>(null);
  const [challenge, setChallenge]   = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!firebaseUser) return;
    try {
      const [statsData, challenges] = await Promise.all([
        getUserStats(firebaseUser.uid),
        getChallenges(true),
      ]);
      setStats(statsData);
      if (challenges.length > 0) setChallenge(challenges[0]);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => {
    if (!authLoading && firebaseUser) fetchData();
  }, [firebaseUser, authLoading]));

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const getDayLabel = (dow: number) => {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dow] ?? '';
  };

  const getBarHeight = (mins: number, maxMins: number) => {
    if (!maxMins) return 4;
    return Math.max(4, (mins / maxMins) * 80);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const totalHours   = Math.floor((stats?.total_minutes ?? 0) / 60);
  const totalMinsRem = (stats?.total_minutes ?? 0) % 60;
  const breakdown    = stats?.weekly_breakdown ?? [];
  const maxMins      = Math.max(...breakdown.map((d: any) => Number(d.mins)), 1);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good reading,</Text>
          <Text style={styles.userName}>{firebaseUser?.displayName ?? 'Reader'} 👋</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {firebaseUser?.displayName?.charAt(0).toUpperCase() ?? '?'}
          </Text>
        </View>
      </View>

      {/* Active challenge banner */}
      {challenge && (
        <View style={styles.challengeBanner}>
          <Text style={styles.challengeIcon}>🏆</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.challengeTitle}>{challenge.title}</Text>
            <Text style={styles.challengeSub}>Goal: {challenge.daily_minutes} mins/day</Text>
          </View>
        </View>
      )}

      {/* Stat cards row 1 */}
      <View style={styles.row}>
        <StatCard
          label="Books Read"
          value={stats?.total_books ?? 0}
          icon="📚"
          color={colors.blue}
        />
        <StatCard
          label="Total Minutes"
          value={stats?.total_minutes ?? 0}
          icon="⏱"
          color={colors.orange}
        />
      </View>

      {/* Stat card row 2 — full width */}
      <View style={styles.rowFull}>
        <StatCard
          label="Time in Hours"
          value={`${totalHours}h ${totalMinsRem}m`}
          icon="🏆"
          color={colors.purple}
        />
      </View>

      {/* Stat cards row 3 */}
      <View style={styles.row}>
        <StatCard
          label="This Week"
          value={stats?.this_week ?? 0}
          unit="min"
          icon="📅"
          color={colors.primary}
        />
        <StatCard
          label="This Month"
          value={stats?.this_month ?? 0}
          unit="min"
          icon="📆"
          color="#E8733A"
        />
      </View>

      {/* Weekly bar chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>This Week</Text>
        <View style={styles.chart}>
          {[0, 1, 2, 3, 4, 5, 6].map((dow) => {
            const found  = breakdown.find((d: any) => Number(d.day) === dow);
            const mins   = found ? Number(found.mins) : 0;
            const height = getBarHeight(mins, maxMins);
            const isToday = new Date().getDay() === dow;
            return (
              <View key={dow} style={styles.barColumn}>
                <Text style={styles.barValue}>{mins > 0 ? mins : ''}</Text>
                <View style={styles.barTrack}>
                  <View style={[
                    styles.bar,
                    { height, backgroundColor: isToday ? colors.primary : colors.primaryLight },
                  ]} />
                </View>
                <Text style={[styles.barLabel, isToday && styles.barLabelToday]}>
                  {getDayLabel(dow)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content:   { padding: spacing.md, paddingTop: spacing.lg + 16, paddingBottom: spacing.xl },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greeting:  { fontSize: 14, color: colors.textMuted },
  userName:  { fontSize: 22, fontWeight: font.bold, color: colors.text },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: font.bold, color: '#fff' },
  challengeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 12,
  },
  challengeIcon:  { fontSize: 24 },
  challengeTitle: { fontSize: 14, fontWeight: font.bold, color: '#fff' },
  challengeSub:   { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  rowFull: {
    marginBottom: spacing.sm,
  },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: { fontSize: 16, fontWeight: font.bold, color: colors.text, marginBottom: spacing.md },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
  },
  barColumn:      { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  barValue:       { fontSize: 9, color: colors.textMuted, height: 14 },
  barTrack:       { width: '60%', height: 80, justifyContent: 'flex-end' },
  bar:            { width: '100%', borderRadius: 4 },
  barLabel:       { fontSize: 10, color: colors.textMuted, fontWeight: font.medium },
  barLabelToday:  { color: colors.primary, fontWeight: font.bold },
});