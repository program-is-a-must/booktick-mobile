import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../constants/theme';

export default function AdminTabEntry() {
  const { user, token } = useAuth();

  useEffect(() => {
    if (!token || user?.role !== 'admin') {
      // Non-admin somehow got here → send back to home
      router.replace('/(tabs)');
      return;
    }
    // Admin → go to the full admin panel
    router.replace("/(admin)/index");
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
