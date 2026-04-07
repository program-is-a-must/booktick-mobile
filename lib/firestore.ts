import {
  collection, addDoc, getDocs, deleteDoc,
  doc, query, where, orderBy, updateDoc,
  setDoc, getDoc, Timestamp, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// ─── Types ───────────────────────────────────────────────
export interface ReadingSession {
  id?:              string;
  userId:           string;
  bookTitle:        string;
  durationMinutes:  number;
  sessionDate:      string;
  createdAt?:       any;
}

export interface Challenge {
  id?:            string;
  title:          string;
  dailyMinutes:   number;
  startDate:      string;
  endDate:        string;
  isActive:       boolean;
  createdAt?:     any;
}

export interface UserProfile {
  uid:         string;
  name:        string;
  email:       string;
  role:        'user' | 'admin';
  isBanned:    boolean;
  isSuspended: boolean;
  createdAt?:  any;
}

// ─── User Profile ─────────────────────────────────────────
export async function createUserProfile(
  uid: string,
  name: string,
  email: string,
  role: 'user' | 'admin' = 'user'
): Promise<void> {
  await setDoc(doc(db, 'users', uid), {
    uid,
    name,
    email,
    role,
    isBanned:    false,
    isSuspended: false,
    createdAt:   serverTimestamp(),
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  await updateDoc(doc(db, 'users', uid), data);
}

// ─── Reading Sessions ─────────────────────────────────────
export async function addSession(session: ReadingSession): Promise<string> {
  const ref = await addDoc(collection(db, 'sessions'), {
    ...session,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getUserSessions(userId: string): Promise<ReadingSession[]> {
  const q = query(
    collection(db, 'sessions'),
    where('userId', '==', userId),
    orderBy('sessionDate', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ReadingSession));
}

export async function deleteSession(sessionId: string): Promise<void> {
  await deleteDoc(doc(db, 'sessions', sessionId));
}

export async function getUserStats(userId: string) {
  const sessions = await getUserSessions(userId);

  const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalBooks   = new Set(sessions.map(s => s.bookTitle)).size;

  // Weekly breakdown
  const now       = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const weekSessions = sessions.filter(s => {
    const d = new Date(s.sessionDate);
    return d >= weekStart && d <= weekEnd;
  });

  const thisWeek = weekSessions.reduce((sum, s) => sum + s.durationMinutes, 0);

  // Monthly
  const monthSessions = sessions.filter(s => {
    const d = new Date(s.sessionDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const thisMonth = monthSessions.reduce((sum, s) => sum + s.durationMinutes, 0);

  // Weekly breakdown by day (0=Sun...6=Sat)
  const weeklyBreakdown: { day: number; mins: number }[] = [];
  for (let i = 0; i <= 6; i++) {
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + i);
    const dateStr = dayDate.toISOString().split('T')[0];
    const mins = weekSessions
      .filter(s => s.sessionDate === dateStr)
      .reduce((sum, s) => sum + s.durationMinutes, 0);
    weeklyBreakdown.push({ day: i, mins });
  }

  return {
    totalBooks,
    totalMinutes,
    totalHours:      Math.round(totalMinutes / 60 * 10) / 10,
    thisWeek,
    thisMonth,
    weeklyBreakdown,
  };
}

// ─── Challenges ───────────────────────────────────────────
export async function getChallenges(activeOnly = true): Promise<Challenge[]> {
  let q;
  if (activeOnly) {
    q = query(
      collection(db, 'challenges'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
  } else {
    q = query(
      collection(db, 'challenges'),
      orderBy('createdAt', 'desc')
    );
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Challenge));
}

export async function createChallenge(challenge: Omit<Challenge, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'challenges'), {
    ...challenge,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateChallenge(id: string, data: Partial<Challenge>): Promise<void> {
  await updateDoc(doc(db, 'challenges', id), data);
}

export async function deleteChallenge(id: string): Promise<void> {
  await deleteDoc(doc(db, 'challenges', id));
}

// ─── Admin ────────────────────────────────────────────────
export async function getAllUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => d.data() as UserProfile);
}

export async function getAdminOverview() {
  const [usersSnap, sessionsSnap] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'sessions')),
  ]);

  const users    = usersSnap.docs.map(d => d.data() as UserProfile);
  const sessions = sessionsSnap.docs.map(d => d.data() as ReadingSession);

  const totalUsers    = users.filter(u => u.role !== 'admin').length;
  const totalSessions = sessions.length;
  const totalMinutes  = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const bannedUsers   = users.filter(u => u.isBanned).length;

  const today        = new Date().toISOString().split('T')[0];
  const activeToday  = sessions.filter(s => s.sessionDate === today).length;

  // Top readers this week
  const now       = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekSessions = sessions.filter(s => new Date(s.sessionDate) >= weekStart);

  const readerMap: Record<string, number> = {};
  weekSessions.forEach(s => {
    readerMap[s.userId] = (readerMap[s.userId] || 0) + s.durationMinutes;
  });

  const topReaders = Object.entries(readerMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([uid, mins]) => {
      const user = users.find(u => u.uid === uid);
      return {
        id:   uid,
        name:  user?.name  ?? 'Unknown',
        email: user?.email ?? '',
        reading_sessions_sum_duration_minutes: mins,
      };
    });

  return {
    total_users:    totalUsers,
    total_sessions: totalSessions,
    total_minutes:  totalMinutes,
    total_hours:    Math.round(totalMinutes / 60 * 10) / 10,
    banned_users:   bannedUsers,
    active_today:   activeToday,
    top_readers:    topReaders,
  };
}
