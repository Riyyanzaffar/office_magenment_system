import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '@/providers/AuthProvider';

export default function EntryScreen() {
  const { session, profile, loading, profileError } = useAuth();

  if (loading) return <View style={styles.loading}><ActivityIndicator color="#143B4A" size="large" /></View>;
  if (!session) return <Redirect href="/(auth)/welcome" />;
  if (!session.user.email_confirmed_at) return <Redirect href="/(auth)/verify-email" />;
  if (profileError) return <Redirect href="/(auth)/unauthorized" />;
  if (!profile) return <Redirect href="/(auth)/unauthorized" />;
  if (profile.account_status === 'pending') return <Redirect href="/(auth)/pending-approval" />;
  if (profile.account_status === 'rejected') return <Redirect href="/(auth)/account-rejected" />;
  if (profile.account_status !== 'active') return <Redirect href="/(auth)/unauthorized" />;

  if (profile.role === 'admin') return <Redirect href="/(admin)" />;
  if (profile.role === 'hr') return <Redirect href="/(hr)" />;
  return <Redirect href="/(employee)" />;
}

const styles = StyleSheet.create({ loading: { flex: 1, backgroundColor: '#F6F8FA', justifyContent: 'center', alignItems: 'center' } });
