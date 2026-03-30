import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, font } from '../constants/theme';

export default function SessionCard({ session, onDelete }) {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-NG', {
      weekday: 'short',
      month:   'short',
      day:     'numeric',
    });
  };

  const formatDuration = (mins) => {
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.bookIcon}>📖</Text>
      </View>
      <View style={styles.middle}>
        <Text style={styles.title} numberOfLines={1}>{session.book_title}</Text>
        <Text style={styles.date}>{formatDate(session.session_date)}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.duration}>{formatDuration(session.duration_minutes)}</Text>
        <TouchableOpacity onPress={() => onDelete(session.id)} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    gap: 12,
  },
  left: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookIcon: {
    fontSize: 18,
  },
  middle: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: font.medium,
    color: colors.text,
    marginBottom: 3,
  },
  date: {
    fontSize: 12,
    color: colors.textMuted,
  },
  right: {
    alignItems: 'flex-end',
    gap: 6,
  },
  duration: {
    fontSize: 14,
    fontWeight: font.bold,
    color: colors.primary,
  },
  deleteBtn: {
    padding: 2,
  },
  deleteText: {
    fontSize: 14,
  },
});