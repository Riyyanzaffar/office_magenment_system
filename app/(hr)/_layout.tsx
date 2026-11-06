import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ClipboardCheck, UsersRound } from 'lucide-react-native';

import { useAuth } from '@/providers/AuthProvider';

export default function HrLayout() {
  const { loading, session, profile } = useAuth();
  if (loading) return <View style={styles.loading}><ActivityIndicator color="#143B4A" /></View>;
  if (!session || !profile || !['hr', 'admin'].includes(profile.role) || profile.account_status !== 'active') return <Redirect href="/" />;
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#143B4A', tabBarInactiveTintColor: '#809096' }}><Tabs.Screen name="index" options={{ title: 'Reviews', tabBarIcon: ({ color, size }) => <ClipboardCheck color={color} size={size} /> }} /><Tabs.Screen name="employees" options={{ title: 'Employees', tabBarIcon: ({ color, size }) => <UsersRound color={color} size={size} /> }} /></Tabs>;
}

const styles = StyleSheet.create({ loading: { flex: 1, justifyContent: 'center', alignItems: 'center' } });
