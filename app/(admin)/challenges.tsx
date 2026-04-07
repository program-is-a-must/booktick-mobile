import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  Alert, RefreshControl, ActivityIndicator,
  TouchableOpacity, TextInput, Modal, ScrollView, Switch
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { getChallenges, createChallenge, updateChallenge, deleteChallenge, Challenge } from '../../lib/firestore';

const emptyForm = {
  title:         '',
  dailyMinutes: '15',
  startDate:    new Date().toISOString().split('T')[0],
  endDate:      '',
  isActive:     true,
};

export default function AdminChallenges() {
  const { loading: authLoading } = useAuth();
  const [challenges, setChallenges]   = useState<Challenge[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [form, setForm]               = useState(emptyForm);
  const [saving, setSaving]           = useState(false);

  const fetchChallenges = async () => {
    try {
      const data = await getChallenges(false);
      setChallenges(data);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => {
    if (!authLoading) fetchChallenges();
  }, [authLoading]));

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalVisible(true);
  };

  const openEdit = (challenge: Challenge) => {
    setEditingId(challenge.id!);
    setForm({
      title:         challenge.title,
      dailyMinutes: String(challenge.dailyMinutes),
      startDate:    challenge.startDate.split('T')[0],
      endDate:      challenge.endDate.split('T')[0],
      isActive:     challenge.isActive,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.endDate) {
      Alert.alert('Missing fields', 'Please fill in title and end date.');
      return;
    }
    setSaving(true);
    const body = {
      title:         form.title,
      dailyMinutes: Number(form.dailyMinutes),
      startDate:    form.startDate,
      endDate:      form.endDate,
      isActive:     form.isActive,
    };

    try {
      if (editingId) {
        await updateChallenge(editingId, body);
      } else {
        await createChallenge(body as any);
      }
      setSaving(false);
      setModalVisible(false);
      fetchChallenges();
    } catch (error) {
      setSaving(false);
      Alert.alert('Error', 'Could not save challenge.');
    }
  };

  const handleDelete = (challenge: Challenge) => {
    Alert.alert(
      'Delete Challenge',
      `Delete "${challenge.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteChallenge(challenge.id!);
              setChallenges(prev => prev.filter(c => c.id !== challenge.id));
            } catch (error) {
              Alert.alert('Error', 'Could not delete challenge.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const renderChallenge = ({ item }: { item: Challenge }) => (
    <View style={styles.challengeCard}>
      <View style={styles.challengeTop}>
        <View style={[styles.activeDot, { backgroundColor: item.isActive ? '#10B981' : '#64748B' }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.challengeTitle}>{item.title}</Text>
          <Text style={styles.challengeMeta}>
            ⏱ {item.dailyMinutes} mins/day
          </Text>
          <Text style={styles.challengeDates}>
            {formatDate(item.startDate)} — {formatDate(item.endDate)}
          </Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: item.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)' }]}>
          <Text style={[styles.statusPillText, { color: item.isActive ? '#10B981' : '#64748B' }]}>
            {item.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View style={styles.challengeActions}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => openEdit(item)}
        >
          <Text style={styles.editBtnText}>✏️ Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDelete(item)}
        >
          <Text style={styles.deleteBtnText}>🗑 Delete</Text>
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
        data={challenges}
        keyExtractor={(item) => item.id!}
        renderItem={renderChallenge}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchChallenges(); }} tintColor="#3B82F6" />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View>
              <Text style={styles.pageTitle}>Challenges 🏆</Text>
              <Text style={styles.pageSubtitle}>{challenges.length} challenges created</Text>
            </View>
            <TouchableOpacity style={styles.createBtn} onPress={openCreate}>
              <Text style={styles.createBtnText}>+ New</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏆</Text>
            <Text style={styles.emptyText}>No challenges yet</Text>
            <TouchableOpacity style={styles.createBtnLarge} onPress={openCreate}>
              <Text style={styles.createBtnText}>Create First Challenge</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Create / Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>
                {editingId ? 'Edit Challenge' : 'New Challenge'}
              </Text>

              <Text style={styles.fieldLabel}>TITLE</Text>
              <TextInput
                style={styles.fieldInput}
                value={form.title}
                onChangeText={(v) => setForm(f => ({ ...f, title: v }))}
                placeholder="E.G. READ 15 MINS DAILY"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />

              <Text style={styles.fieldLabel}>DAILY MINUTES GOAL</Text>
              <TextInput
                style={styles.fieldInput}
                value={form.dailyMinutes}
                onChangeText={(v) => setForm(f => ({ ...f, dailyMinutes: v }))}
                keyboardType="numeric"
                placeholder="15"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />

              <Text style={styles.fieldLabel}>START DATE (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.fieldInput}
                value={form.startDate}
                onChangeText={(v) => setForm(f => ({ ...f, startDate: v }))}
                placeholder="2026-04-01"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />

              <Text style={styles.fieldLabel}>END DATE (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.fieldInput}
                value={form.endDate}
                onChangeText={(v) => setForm(f => ({ ...f, endDate: v }))}
                placeholder="2026-04-30"
                placeholderTextColor="rgba(255,255,255,0.3)"
              />

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Active</Text>
                <Switch
                  value={form.isActive}
                  onValueChange={(v) => setForm(f => ({ ...f, isActive: v }))}
                  trackColor={{ false: '#334155', true: '#10B981' }}
                  thumbColor="#fff"
                />
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.saveBtnText}>
                      {editingId ? 'Update Challenge' : 'Create Challenge'}
                    </Text>
                }
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1A2E' },
  content:   { padding: 16, paddingTop: 56, paddingBottom: 32 },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F1A2E' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pageTitle:    { fontSize: 24, fontWeight: '700', color: '#fff' },
  pageSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  createBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  createBtnLarge: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 16,
  },
  createBtnText: { fontSize: 14, color: '#fff', fontWeight: '700' },
  challengeCard: {
    backgroundColor: '#1A2E4A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  challengeTop:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  activeDot:       { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  challengeTitle:  { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 },
  challengeMeta:   { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 3 },
  challengeDates:  { fontSize: 12, color: 'rgba(255,255,255,0.3)' },
  statusPill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusPillText:    { fontSize: 11, fontWeight: '600' },
  challengeActions:  { flexDirection: 'row', gap: 10 },
  editBtn: {
    flex: 1,
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
  },
  editBtnText:   { fontSize: 13, color: '#3B82F6', fontWeight: '600' },
  deleteBtn: {
    flex: 1,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  deleteBtnText:  { fontSize: 13, color: '#EF4444', fontWeight: '600' },
  empty:          { alignItems: 'center', paddingVertical: 60 },
  emptyIcon:      { fontSize: 48, marginBottom: 12 },
  emptyText:      { fontSize: 16, color: 'rgba(255,255,255,0.3)' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#1A2E4A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle:  { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 20 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B9FD4',
    letterSpacing: 1.2,
    marginBottom: 6,
    marginTop: 12,
  },
  fieldInput: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  switchLabel: { fontSize: 15, color: '#fff', fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText:     { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cancelBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: 15 },
});