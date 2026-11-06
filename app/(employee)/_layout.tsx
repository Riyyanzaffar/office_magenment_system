import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Home, UserRound } from 'lucide-react-native';

import { useAuth } from '@/providers/AuthProvider';

export default function EmployeeLayout() {
  const { loading, session, profile } = useAuth();
  if (loading) return <View style={styles.loading}><ActivityIndicator color="#143B4A" /></View>;
  if (!session || !profile || profile.role !== 'employee' || profile.account_status !== 'active') return <Redirect href="/" />;

  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#143B4A', tabBarInactiveTintColor: '#809096' }}><Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }} /><Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} /> }} /></Tabs>;
}

const styles = StyleSheet.create({ loading: { flex: 1, justifyContent: 'center', alignItems: 'center' } });
