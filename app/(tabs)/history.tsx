import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  Alert, RefreshControl, ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { getUserSessions, deleteSession, ReadingSession } from '../../lib/firestore';
import { colors, spacing, radius, font } from '../../constants/theme';

const cardColors = [colors.blue, colors.orange, colors.purple, colors.primary, '#E8733A'];

export default function History() {
  const { firebaseUser, loading: authLoading } = useAuth();
  const [sessions, setSessions]     = useState<ReadingSession[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSessions = async () => {
    if (!firebaseUser) return;
    try {
      const data = await getUserSessions(firebaseUser.uid);
      setSessions(data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => {
    if (!authLoading && firebaseUser) fetchSessions();
  }, [firebaseUser, authLoading]));

  const onRefresh = () => { setRefreshing(true); fetchSessions(); };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSession(id);
              setSessions(prev => prev.filter(s => s.id !== id));
            } catch (error) {
              Alert.alert('Error', 'Could not delete session.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      weekday: 'short', month: 'short', day: 'numeric',
    });
  };

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const renderItem = ({ item, index }: { item: ReadingSession; index: number }) => {
    const bgColor = cardColors[index % cardColors.length];
    return (
      <View style={[styles.sessionCard, { backgroundColor: bgColor }]}>
        <View style={styles.sessionLeft}>
          <Text style={styles.sessionTitle} numberOfLines={1}>
            {item.bookTitle}
          </Text>
          <Text style={styles.sessionDate}>{formatDate(item.sessionDate)}</Text>
        </View>
        <View style={styles.sessionRight}>
          <Text style={styles.sessionDuration}>{formatDuration(item.durationMinutes)}</Text>
          <TouchableOpacity
            onPress={() => handleDelete(item.id!)}
            style={styles.deleteBtn}
          >
            <Text style={styles.deleteText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
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
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id!}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View>
              <Text style={styles.pageTitle}>Reading History</Text>
              <Text style={styles.pageSubtitle}>
                {sessions.length} session{sessions.length !== 1 ? 's' : ''} logged
              </Text>
            </View>
            <View style={styles.headerIcon}>
              <Text style={{ fontSize: 28 }}>📋</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyTitle}>No sessions yet</Text>
            <Text style={styles.emptyText}>
              Tap the Add tab to log your first reading session
            </Text>
          </View>
        }
      />
    </View>
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
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    minHeight: 80,
  },
  sessionLeft:     { flex: 1, paddingRight: spacing.sm },
  sessionTitle:    { fontSize: 16, fontWeight: font.bold, color: '#fff', marginBottom: 4 },
  sessionDate:     { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  sessionRight:    { alignItems: 'flex-end', gap: 8 },
  sessionDuration: { fontSize: 18, fontWeight: font.bold, color: '#fff' },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: { fontSize: 12, color: '#fff', fontWeight: font.bold },
  empty:      { alignItems: 'center', paddingVertical: spacing.xl * 2 },
  emptyIcon:  { fontSize: 56, marginBottom: spacing.md },
  emptyTitle: { fontSize: 20, fontWeight: font.bold, color: colors.text, marginBottom: spacing.sm },
  emptyText:  { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
});