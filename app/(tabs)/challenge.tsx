import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { getChallenges, getUserStats } from '../../lib/firestore';
import { colors, spacing, radius, font } from '../../constants/theme';

export default function Challenge() {
  const { firebaseUser, loading: authLoading } = useAuth();
  const [challenge, setChallenge]   = useState<any>(null);
  const [stats, setStats]           = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!firebaseUser) return;
    try {
      const [challenges, statsData] = await Promise.all([
        getChallenges(true),
        getUserStats(firebaseUser.uid),
      ]);
      if (challenges.length > 0) setChallenge(challenges[0]);
      setStats(statsData);
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

  const getTodayMinutes = (): number => {
    if (!stats?.weeklyBreakdown) return 0;
    const today = new Date().getDay();
    const found = stats.weeklyBreakdown.find((d: any) => Number(d.day) === today);
    return found ? Number(found.mins) : 0;
  };

  const getProgress = (): number => {
    if (!challenge) return 0;
    return Math.min(1, getTodayMinutes() / challenge.dailyMinutes);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!challenge) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyIcon}>🏆</Text>
        <Text style={styles.emptyTitle}>No active challenge</Text>
        <Text style={styles.emptyText}>Ask an admin to create a challenge</Text>
      </View>
    );
  }

  const todayMins  = getTodayMinutes();
  const progress   = getProgress();
  const remaining  = Math.max(0, challenge.dailyMinutes - todayMins);
  const isComplete = todayMins >= challenge.dailyMinutes;
  const pct        = Math.round(progress * 100);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Challenge</Text>
          <Text style={styles.pageSubtitle}>Keep your streak going 🔥</Text>
        </View>
        <View style={styles.headerIcon}>
          <Text style={{ fontSize: 28 }}>🏆</Text>
        </View>
      </View>

      {/* Challenge hero card */}
      <View style={[styles.heroCard, { backgroundColor: colors.purple }]}>
        <Text style={styles.heroLabel}>ACTIVE CHALLENGE</Text>
        <Text style={styles.heroTitle}>{challenge.title}</Text>
        <View style={styles.heroMeta}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>⏱ {challenge.dailyMinutes} mins/day</Text>
          </View>
          <Text style={styles.heroDates}>
            {formatDate(challenge.startDate)} — {formatDate(challenge.endDate)}
          </Text>
        </View>
      </View>

      {/* Progress card */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Today's Progress</Text>
          <Text style={[styles.progressPct, isComplete && styles.progressPctDone]}>
            {pct}%
          </Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[
            styles.progressFill,
            { width: `${pct}%` as any },
            isComplete && styles.progressFillDone,
          ]} />
        </View>

        {/* 3 stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{todayMins}</Text>
            <Text style={styles.statLabel}>mins read</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{challenge.dailyMinutes}</Text>
            <Text style={styles.statLabel}>daily goal</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statValue, isComplete && { color: colors.primary }]}>
              {isComplete ? '✅' : remaining}
            </Text>
            <Text style={styles.statLabel}>{isComplete ? 'done!' : 'mins left'}</Text>
          </View>
        </View>
      </View>

      {/* Status message */}
      <View style={[styles.statusBanner, isComplete ? styles.statusDone : styles.statusPending]}>
        <Text style={[styles.statusText, isComplete ? styles.statusTextDone : styles.statusTextPending]}>
          {isComplete
            ? "🎉 You've hit today's goal! Amazing work."
            : `📖 Read ${remaining} more minutes to hit today's goal.`
          }
        </Text>
      </View>

      {/* Overall stats */}
      <View style={styles.overallCard}>
        <Text style={styles.overallTitle}>Overall Stats</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats?.totalBooks ?? 0}</Text>
            <Text style={styles.statLabel}>books</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats?.totalHours ?? 0}</Text>
            <Text style={styles.statLabel}>hours</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats?.thisWeek ?? 0}</Text>
            <Text style={styles.statLabel}>this week</Text>
          </View>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.background },
  content:    { padding: spacing.md, paddingTop: spacing.lg + 16, paddingBottom: spacing.xl },
  centered:   { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: spacing.lg },
  emptyIcon:  { fontSize: 56, marginBottom: spacing.md },
  emptyTitle: { fontSize: 20, fontWeight: font.bold, color: colors.text, marginBottom: spacing.sm },
  emptyText:  { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
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
  heroCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: font.bold,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: font.bold,
    color: '#fff',
    marginBottom: spacing.md,
  },
  heroMeta:      { gap: 8 },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroBadgeText: { fontSize: 13, color: '#fff', fontWeight: font.medium },
  heroDates:     { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  progressCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressTitle:   { fontSize: 16, fontWeight: font.bold, color: colors.text },
  progressPct:     { fontSize: 20, fontWeight: font.bold, color: colors.blue },
  progressPctDone: { color: colors.primary },
  progressTrack: {
    height: 14,
    backgroundColor: colors.primaryLight,
    borderRadius: 7,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.blue,
    borderRadius: 7,
  },
  progressFillDone: { backgroundColor: colors.primary },
  statsRow:    { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statBox:     { alignItems: 'center', flex: 1 },
  statValue:   { fontSize: 22, fontWeight: font.bold, color: colors.text },
  statLabel:   { fontSize: 11, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  statDivider: { width: 1, height: 36, backgroundColor: colors.border },
  statusBanner: { borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  statusDone:   { backgroundColor: '#E6F4F1', borderWidth: 1.5, borderColor: colors.primary },
  statusPending: { backgroundColor: '#FFF8EC', borderWidth: 1.5, borderColor: colors.orange },
  statusText:        { fontSize: 14, lineHeight: 22, textAlign: 'center', fontWeight: font.medium },
  statusTextDone:    { color: colors.primary },
  statusTextPending: { color: '#B37A20' },
  overallCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  overallTitle: { fontSize: 16, fontWeight: font.bold, color: colors.text, marginBottom: spacing.md },
});