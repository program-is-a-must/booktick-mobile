import { useState, useEffect } from 'react';
import {
  View, Text, Switch, StyleSheet,
  TouchableOpacity, Alert, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing, radius, font } from '../../constants/theme';

export default function Settings() {
  const { user, logout } = useAuth();
  const [reminderOn, setReminderOn]         = useState<boolean>(false);
  const [reminderHour, setReminderHour]     = useState<number>(20);
  const [reminderMinute, setReminderMinute] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      const on = await AsyncStorage.getItem('reminder_on');
      const h  = await AsyncStorage.getItem('reminder_hour');
      const m  = await AsyncStorage.getItem('reminder_minute');
      if (on) setReminderOn(on === 'true');
      if (h)  setReminderHour(Number(h));
      if (m)  setReminderMinute(Number(m));
    };
    load();
  }, []);

  const toggleReminder = async (value: boolean): Promise<void> => {
    setReminderOn(value);
    await AsyncStorage.setItem('reminder_on', String(value));
    if (value) {
      Alert.alert(
        'Reminder saved ✅',
        `Time set to ${formatTime(reminderHour, reminderMinute)}.\nYou'll receive a notification at this time every day to remind you to read.`
      );
    }
  };

  const changeHour = async (direction: number): Promise<void> => {
    const newHour = (reminderHour + direction + 24) % 24;
    setReminderHour(newHour);
    await AsyncStorage.setItem('reminder_hour', String(newHour));
  };

  const changeMinute = async (direction: number): Promise<void> => {
    const newMin = (reminderMinute + direction + 60) % 60;
    setReminderMinute(newMin);
    await AsyncStorage.setItem('reminder_minute', String(newMin));
  };

  const formatTime = (h: number, m: number): string => {
    const period = h >= 12 ? 'PM' : 'AM';
    const hour   = h % 12 === 0 ? 12 : h % 12;
    const min    = String(m).padStart(2, '0');
    return `${hour}:${min} ${period}`;
  };

  const handleLogout = (): void => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Settings</Text>
          <Text style={styles.pageSubtitle}>Manage your preferences</Text>
        </View>
        <View style={styles.headerIcon}>
          <Text style={{ fontSize: 28 }}>⚙️</Text>
        </View>
      </View>

      {/* User card */}
      <View style={[styles.userCard, { backgroundColor: colors.primary }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() ?? '?'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role ?? 'user'}</Text>
        </View>
      </View>

      {/* Reminder section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DAILY REMINDER</Text>

        <View style={styles.noticeBanner}>
          <Text style={styles.noticeText}>
            📱 Your time preference is saved and will activate in the full APK build.
          </Text>
        </View>

        <View style={styles.row}>
          <View>
            <Text style={styles.rowLabel}>Enable reminder</Text>
            <Text style={styles.rowSub}>Get notified to read every day</Text>
          </View>
          <Switch
            value={reminderOn}
            onValueChange={toggleReminder}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#fff"
          />
        </View>

        {/* Time picker */}
        <View style={[styles.timePicker, !reminderOn && styles.disabled]}>
          <Text style={styles.timePickerLabel}>
            Reminder time — {formatTime(reminderHour, reminderMinute)}
          </Text>
          <View style={styles.timeControls}>

            {/* Hour */}
            <View style={styles.timeUnit}>
              <TouchableOpacity onPress={() => changeHour(1)} disabled={!reminderOn} style={styles.timeBtn}>
                <Text style={styles.timeBtnText}>▲</Text>
              </TouchableOpacity>
              <View style={styles.timeValueBox}>
                <Text style={styles.timeValue}>
                  {String(reminderHour % 12 === 0 ? 12 : reminderHour % 12).padStart(2, '0')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => changeHour(-1)} disabled={!reminderOn} style={styles.timeBtn}>
                <Text style={styles.timeBtnText}>▼</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.timeSep}>:</Text>

            {/* Minute */}
            <View style={styles.timeUnit}>
              <TouchableOpacity onPress={() => changeMinute(5)} disabled={!reminderOn} style={styles.timeBtn}>
                <Text style={styles.timeBtnText}>▲</Text>
              </TouchableOpacity>
              <View style={styles.timeValueBox}>
                <Text style={styles.timeValue}>
                  {String(reminderMinute).padStart(2, '0')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => changeMinute(-5)} disabled={!reminderOn} style={styles.timeBtn}>
                <Text style={styles.timeBtnText}>▼</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.timeValueBox, { paddingHorizontal: 10 }]}>
              <Text style={styles.timePeriod}>
                {reminderHour >= 12 ? 'PM' : 'AM'}
              </Text>
            </View>

          </View>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutIcon}>👋</Text>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.background },
  content:    { padding: spacing.md, paddingTop: spacing.lg + 16, paddingBottom: spacing.xl },
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: font.bold, color: '#fff' },
  userName:   { fontSize: 17, fontWeight: font.bold, color: '#fff' },
  userEmail:  { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  roleText: { fontSize: 12, color: '#fff', fontWeight: font.medium },
  section: {
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
  sectionTitle: {
    fontSize: 11,
    fontWeight: font.bold,
    color: colors.primary,
    letterSpacing: 1.2,
    marginBottom: spacing.md,
  },
  noticeBanner: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noticeText: { fontSize: 12, color: colors.primary, lineHeight: 18 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  rowLabel: { fontSize: 15, fontWeight: font.medium, color: colors.text },
  rowSub:   { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  timePicker: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  disabled:        { opacity: 0.4 },
  timePickerLabel: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.md, fontWeight: font.medium },
  timeControls:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeUnit:        { alignItems: 'center', gap: 6 },
  timeBtn:         { padding: 6 },
  timeBtnText:     { fontSize: 16, color: colors.primary, fontWeight: font.bold },
  timeValueBox: {
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minWidth: 56,
    alignItems: 'center',
  },
  timeValue:  { fontSize: 26, fontWeight: font.bold, color: colors.text },
  timeSep:    { fontSize: 24, fontWeight: font.bold, color: colors.text, marginBottom: 4 },
  timePeriod: { fontSize: 16, fontWeight: font.bold, color: colors.textMuted },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: '#FFD0D0',
    marginTop: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  logoutIcon: { fontSize: 18 },
  logoutText: { fontSize: 15, fontWeight: font.bold, color: colors.danger },
});