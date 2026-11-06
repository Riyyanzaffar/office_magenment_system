import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '@/components/ActionButton';
import { useAuth } from '@/providers/AuthProvider';

export default function EmployeeHomeScreen() {
  const { profile, signOut } = useAuth();
  return <View style={styles.container}><Text style={styles.eyebrow}>EMPLOYEE SPACE</Text><Text style={styles.title}>Good to see you, {profile?.display_name?.split(' ')[0] || 'there'}.</Text><Text style={styles.subtitle}>Your approved workplace access is ready. Attendance and leave features will arrive in the next phase.</Text><View style={styles.card}><Text style={styles.cardLabel}>ACCOUNT STATUS</Text><Text style={styles.cardValue}>Active Employee</Text><Text style={styles.cardText}>Your account is approved and secured by your company’s access rules.</Text></View><ActionButton label="Sign out" variant="secondary" onPress={() => { void signOut(); router.replace('/(auth)/welcome'); }} /></View>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#F6F8FA', padding: 24, justifyContent: 'center', gap: 16 }, eyebrow: { color: '#4E7B78', fontSize: 12, fontWeight: '800', letterSpacing: 2 }, title: { color: '#142A33', fontSize: 32, lineHeight: 38, fontWeight: '800' }, subtitle: { color: '#5E6D73', fontSize: 16, lineHeight: 24 }, card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, gap: 8, borderWidth: 1, borderColor: '#E1E8EA' }, cardLabel: { color: '#4E7B78', fontSize: 12, fontWeight: '800', letterSpacing: 1.3 }, cardValue: { color: '#143B4A', fontSize: 20, fontWeight: '800' }, cardText: { color: '#6C7B80', lineHeight: 20 } });
