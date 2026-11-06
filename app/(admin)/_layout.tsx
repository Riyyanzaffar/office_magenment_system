import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Building2, LayoutDashboard, Network, Tags, Users, LogOut, Shield, UserCheck } from 'lucide-react-native';
import { router } from 'expo-router';

import { useAuth } from '@/providers/AuthProvider';

export default function AdminLayout() {
  const { loading, session, profile, signOut } = useAuth();
  if (loading) return <View style={styles.loading}><ActivityIndicator color="#143B4A" /></View>;
  if (!session || !profile || profile.role !== 'admin' || profile.account_status !== 'active') return <Redirect href="/" />;

  const handleSignOut = () => {
    void signOut();
    router.replace('/(auth)/welcome');
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitleStyle: { color: '#142A33', fontWeight: '800', fontSize: 18 },
        headerStyle: { backgroundColor: '#FFFFFF', borderBottomColor: '#E4E8E3', borderBottomWidth: 1 },
        headerTintColor: '#143B4A',
        headerRight: () => (
          <Pressable accessibilityRole="button" accessibilityLabel="Sign out" onPress={handleSignOut} style={styles.signOut}>
            <LogOut color="#143B4A" size={20} strokeWidth={2} />
          </Pressable>
        ),
        tabBarActiveTintColor: '#143B4A',
        tabBarInactiveTintColor: '#809096',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E4E8E3',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 6,
          paddingHorizontal: 2,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '700',
          marginTop: 3,
          marginBottom: 1,
          letterSpacing: -0.2,
        },
        tabBarIconStyle: { marginBottom: 1 },
        tabBarItemStyle: { paddingVertical: 3, paddingHorizontal: 2 },
        tabBarAllowFontScaling: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="company"
        options={{ title: 'Company', tabBarIcon: ({ color, size }) => <Building2 color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="departments"
        options={{ title: 'Depts', tabBarIcon: ({ color, size }) => <Network color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="designations"
        options={{ title: 'Roles', tabBarIcon: ({ color, size }) => <Tags color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="employees"
        options={{ title: 'Staff', tabBarIcon: ({ color, size }) => <Users color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="hr-users"
        options={{ title: 'HR', tabBarIcon: ({ color, size }) => <Shield color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="pending"
        options={{ title: 'Pending', tabBarIcon: ({ color, size }) => <UserCheck color={color} size={size} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F5EE' },
  signOut: { paddingHorizontal: 16, paddingVertical: 8 },
});
