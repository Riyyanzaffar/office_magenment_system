import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '@/components/ActionButton';
import { useAuth } from '@/providers/AuthProvider';

export default function EmployeeProfileScreen() {
  const { profile, signOut } = useAuth();
  return <View style={styles.container}><Text style={styles.title}>Profile</Text><View style={styles.card}><Text style={styles.name}>{profile?.display_name || 'Employee'}</Text><Text style={styles.email}>{profile?.email}</Text><Text style={styles.role}>Employee access</Text></View><ActionButton label="Sign out" onPress={() => { void signOut(); router.replace('/(auth)/welcome'); }} /></View>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#F6F8FA', padding: 24, paddingTop: 70, gap: 18 }, title: { color: '#142A33', fontSize: 30, fontWeight: '800' }, card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 22, gap: 8, borderWidth: 1, borderColor: '#E1E8EA' }, name: { color: '#143B4A', fontSize: 22, fontWeight: '800' }, email: { color: '#5E6D73', fontSize: 15 }, role: { color: '#236D63', fontWeight: '800', marginTop: 8 } });
