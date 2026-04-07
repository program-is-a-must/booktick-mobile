import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  Alert, RefreshControl, ActivityIndicator,
  TouchableOpacity, TextInput
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { getAllUsers, updateUserProfile, UserProfile } from '../../lib/firestore';
import { deleteUser } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function AdminUsers() {
  const { loading: authLoading } = useAuth();
  const [users, setUsers]           = useState<UserProfile[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState('');

  const fetchUsers = async () => {
    try {
      const allUsers = await getAllUsers();
      // Filter out admin users
      setUsers(allUsers.filter(u => u.role !== 'admin'));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => {
    if (!authLoading) fetchUsers();
  }, [authLoading]));

  const handleDelete = (user: UserProfile) => {
    Alert.alert(
      'Delete User',
      `Permanently delete ${user.name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'users', user.uid));
              setUsers(prev => prev.filter(u => u.uid !== user.uid));
            } catch (error) {
              Alert.alert('Error', 'Could not delete user.');
            }
          },
        },
      ]
    );
  };

  const handleBan = (user: UserProfile) => {
    const isBanned = user.isBanned;
    Alert.alert(
      isBanned ? 'Unban User' : 'Ban User',
      isBanned
        ? `Unban ${user.name}?`
        : `Ban ${user.name}? They won't be able to log in.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isBanned ? 'Unban' : 'Ban',
          style: isBanned ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await updateUserProfile(user.uid, { isBanned: !isBanned });
              setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, isBanned: !isBanned } : u));
            } catch (error) {
              Alert.alert('Error', 'Could not update user.');
            }
          },
        },
      ]
    );
  };

  const handleSuspend = (user: UserProfile) => {
    const isSuspended = user.isSuspended;
    Alert.alert(
      isSuspended ? 'Unsuspend User' : 'Suspend User',
      isSuspended
        ? `Unsuspend ${user.name}?`
        : `Suspend ${user.name}? They won't be able to log in.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isSuspended ? 'Unsuspend' : 'Suspend',
          style: isSuspended ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await updateUserProfile(user.uid, { isSuspended: !isSuspended });
              setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, isSuspended: !isSuspended } : u));
            } catch (error) {
              Alert.alert('Error', 'Could not update user.');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (user: UserProfile) => {
    if (user.isBanned)    return '#EF4444';
    if (user.isSuspended) return '#F59E0B';
    return '#10B981';
  };

  const getStatusText = (user: UserProfile) => {
    if (user.isBanned)    return 'Banned';
    if (user.isSuspended) return 'Suspended';
    return 'Active';
  };

  const renderUser = ({ item }: { item: UserProfile }) => (
    <View style={styles.userCard}>
      <View style={styles.userTop}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <View style={styles.userMeta}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(item) }]}>
              {getStatusText(item)}
            </Text>
          </View>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, item.isBanned ? styles.actionUnban : styles.actionBan]}
          onPress={() => handleBan(item)}
        >
          <Text style={styles.actionBtnText}>
            {item.isBanned ? '✅ Unban' : '🚫 Ban'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, item.isSuspended ? styles.actionUnban : styles.actionSuspend]}
          onPress={() => handleSuspend(item)}
        >
          <Text style={styles.actionBtnText}>
            {item.isSuspended ? '✅ Unsuspend' : '⏸ Suspend'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionDelete]}
          onPress={() => handleDelete(item)}
        >
          <Text style={styles.actionBtnText}>🗑 Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={users.filter(u =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
        )}
        keyExtractor={(item) => item.uid}
        renderItem={renderUser}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers(); }} tintColor="#3B82F6" />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.pageTitle}>Users 👥</Text>
            <Text style={styles.pageSubtitle}>{users.length} registered users</Text>
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search by name or email..."
                placeholderTextColor="rgba(255,255,255,0.3)"
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1A2E' },
  content:   { padding: 16, paddingTop: 56, paddingBottom: 32 },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F1A2E' },
  header:    { marginBottom: 16 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2E4A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 10,
  },
  searchIcon:  { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14, color: '#fff' },
  userCard: {
    backgroundColor: '#1A2E4A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  userTop:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(59,130,246,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: { fontSize: 18, fontWeight: '700', color: '#3B82F6' },
  userInfo:   { flex: 1 },
  userName:   { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 2 },
  userEmail:  { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6 },
  userMeta:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot:  { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  userSessions: { fontSize: 12, color: 'rgba(255,255,255,0.3)' },
  userStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  userStat:       { flex: 1, alignItems: 'center' },
  userStatValue:  { fontSize: 18, fontWeight: '700', color: '#fff' },
  userStatLabel:  { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  userStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  actions:      { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  actionBan:     { backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  actionUnban:   { backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' },
  actionSuspend: { backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
  actionDelete:  { backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  actionBtnText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  empty:         { alignItems: 'center', paddingVertical: 40 },
  emptyText:     { fontSize: 15, color: 'rgba(255,255,255,0.3)' },
});