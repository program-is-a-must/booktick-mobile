import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiCall } from '../constants/api';

// Types
interface User {
  id:    number;
  name:  string;
  email: string;
  role:  string;
}

interface AuthContextType {
  token:    string | null;
  user:     User | null;
  loading:  boolean;
  login:    (email: string, password: string) => Promise<{ ok: boolean; data: any }>;
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; data: any }>;
  logout:   () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken]     = useState<string | null>(null);
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

useEffect(() => {
  const loadToken = async () => {
    try {
      const saved     = await AsyncStorage.getItem('booktick_token');
      const savedUser = await AsyncStorage.getItem('booktick_user');
      console.log('Token found:', saved ? 'YES' : 'NO'); // ← add this
      if (saved) {
        setToken(saved);
        setUser(savedUser ? JSON.parse(savedUser) : null);
      }
    } catch (e) {
      console.error('Failed to load token', e);
    } finally {
      setLoading(false);
    }
  };
  loadToken();
}, []);

  const register = async (name: string, email: string, password: string) => {
    const { ok, data } = await apiCall('/register', null, {
      method: 'POST',
      body:   JSON.stringify({ name, email, password }),
    });
    if (ok) {
      await AsyncStorage.setItem('booktick_token', data.token);
      await AsyncStorage.setItem('booktick_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    }
    return { ok, data };
  };

  const login = async (email: string, password: string) => {
    const { ok, data } = await apiCall('/login', null, {
      method: 'POST',
      body:   JSON.stringify({ email, password }),
    });
    if (ok) {
      await AsyncStorage.setItem('booktick_token', data.token);
      await AsyncStorage.setItem('booktick_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    }
    return { ok, data };
  };

  const logout = async (): Promise<void> => {
    await apiCall('/logout', token, { method: 'POST' });
    await AsyncStorage.removeItem('booktick_token');
    await AsyncStorage.removeItem('booktick_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}