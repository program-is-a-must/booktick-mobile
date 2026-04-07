import { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Tabs, router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../constants/theme';

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

export default function TabLayout() {
  const { user, token, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!token) router.replace('/(auth)/login');
  }, [token, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!token) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  const isAdmin = user?.role === 'admin';

  return (
    <Tabs
      screenOptions={{
        headerShown:             false,
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor:  colors.border,
          borderTopWidth:  1,
          paddingBottom:   6,
          paddingTop:      6,
          height:          60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title:       'Home',
          tabBarIcon: () => <TabIcon emoji="🏠" />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title:       'Add',
          tabBarIcon: () => <TabIcon emoji="➕" />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title:       'History',
          tabBarIcon: () => <TabIcon emoji="📋" />,
        }}
      />
      <Tabs.Screen
        name="challenge"
        options={{
          title:       'Challenge',
          tabBarIcon: () => <TabIcon emoji="🏆" />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title:       'Settings',
          tabBarIcon: () => <TabIcon emoji="🔔" />,
        }}
      />

      {/* Admin tab — only visible to admins */}
      <Tabs.Screen
        name="admin"
        options={{
          title:       'Admin',
          tabBarIcon: () => <TabIcon emoji="🛡️" />,
          // Hide the tab completely for non-admins
          tabBarItemStyle: isAdmin
            ? {}
            : { display: 'none', width: 0, height: 0 },
          tabBarButton: isAdmin ? undefined : () => null,
        }}
      />
    </Tabs>
  );
}