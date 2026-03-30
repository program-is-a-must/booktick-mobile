import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth'; // <-- wherever you get user role from

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

export default function TabLayout() {
  const { user } = useAuth();               // must contain role/flag
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: () => <TabIcon emoji="🏠" />,
        }}
      />

      <Tabs.Screen
        name="add"
        options={{
          title: 'Add',
          tabBarIcon: () => <TabIcon emoji="➕" />,
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: () => <TabIcon emoji="📋" />,
        }}
      />

      <Tabs.Screen
        name="challenge"
        options={{
          title: 'Challenge',
          tabBarIcon: () => <TabIcon emoji="🏆" />,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: () => <TabIcon emoji="🔔" />,
        }}
      />

      {/* Only render for super admin */}
      {isSuperAdmin && (
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin',
            tabBarIcon: () => <TabIcon emoji="🔐" />,
          }}
        />
      )}
    </Tabs>
  );
}