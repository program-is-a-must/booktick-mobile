import { View, Text, StyleSheet } from 'react-native';
import { spacing, radius, font } from '../constants/theme';

interface StatCardProps {
  label:     string;
  value:     string | number;
  unit?:     string;
  color:     string;   // pass the card background color
  icon:      string;   // emoji icon
}

export default function StatCard({ label, value, unit, color, icon }: StatCardProps) {
  return (
    <View style={[styles.card, { backgroundColor: color }]}>
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.value}>
        {value}{unit ? <Text style={styles.unit}> {unit}</Text> : null}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    minHeight: 140,
    justifyContent: 'flex-end',
  },
  iconWrap: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon:  { fontSize: 18 },
  value: {
    fontSize: 32,
    fontWeight: font.bold,
    color: '#fff',
    marginBottom: 4,
  },
  unit:  { fontSize: 18, fontWeight: font.medium, color: 'rgba(255,255,255,0.85)' },
  label: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: font.medium },
});