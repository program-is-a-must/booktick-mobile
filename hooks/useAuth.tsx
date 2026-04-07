import {
  useState, useEffect,
  createContext, useContext, ReactNode
} from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { createUserProfile, getUserProfile, UserProfile } from '../lib/firestore';

interface AuthContextType {
  token:       string | null;
  user:        UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading:     boolean;
  login:       (email: string, password: string) => Promise<{ ok: boolean; data: any }>;
  adminLogin:  (email: string, password: string) => Promise<{ ok: boolean; data: any }>;
  register:    (name: string, email: string, password: string) => Promise<{ ok: boolean; data: any }>;
  logout:      () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser]                 = useState<UserProfile | null>(null);
  const [token, setToken]               = useState<string | null>(null);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    // Firebase handles persistence automatically
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const idToken = await fbUser.getIdToken();
        const profile = await getUserProfile(fbUser.uid);
        setFirebaseUser(fbUser);
        setToken(idToken);
        setUser(profile);
      } else {
        setFirebaseUser(null);
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const register = async (name: string, email: string, password: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await createUserProfile(cred.user.uid, name, email, 'user');
      const profile = await getUserProfile(cred.user.uid);
      setUser(profile);
      return { ok: true, data: { user: profile } };
    } catch (error: any) {
      console.error('Registration error:', error);
      return { ok: false, data: { message: firebaseError(error.code || error.message) } };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const cred    = await signInWithEmailAndPassword(auth, email, password);
      const profile = await getUserProfile(cred.user.uid);

      // Block banned users
      if (profile?.isBanned) {
        await signOut(auth);
        return { ok: false, data: { message: 'Your account has been banned.' } };
      }

      setUser(profile);
      return { ok: true, data: { user: profile } };
    } catch (error: any) {
      return { ok: false, data: { message: firebaseError(error.code) } };
    }
  };

  // Admin login — same as login but checks for admin role
  const adminLogin = async (email: string, password: string) => {
    try {
      const cred    = await signInWithEmailAndPassword(auth, email, password);
      const profile = await getUserProfile(cred.user.uid);

      if (profile?.role !== 'admin') {
        await signOut(auth);
        return { ok: false, data: { message: 'Access denied — not an admin.' } };
      }

      setUser(profile);
      return { ok: true, data: { user: profile } };
    } catch (error: any) {
      return { ok: false, data: { message: firebaseError(error.code) } };
    }
  };

  const logout = async (): Promise<void> => {
    await signOut(auth);
    setUser(null);
    setToken(null);
    setFirebaseUser(null);
  };

  return (
    <AuthContext.Provider value={{
      token,
      user,
      firebaseUser,
      loading,
      login,
      adminLogin,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

// Convert Firebase error codes to readable messages
function firebaseError(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':  return 'Email already registered.';
    case 'auth/invalid-email':         return 'Invalid email address.';
    case 'auth/weak-password':         return 'Password must be at least 6 characters.';
    case 'auth/user-not-found':        return 'No account found with this email.';
    case 'auth/wrong-password':        return 'Incorrect password.';
    case 'auth/invalid-credential':    return 'Invalid email or password.';
    case 'auth/too-many-requests':     return 'Too many attempts. Try again later.';
    default:                           return 'Something went wrong. Try again.';
  }
}