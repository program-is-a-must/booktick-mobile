import { Redirect, Slot } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function AdminLayout() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Slot />;
}