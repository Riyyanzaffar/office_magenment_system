import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '@/components/ActionButton';
import { AuthShell } from '@/components/AuthShell';
import { useAuth } from '@/providers/AuthProvider';

export default function AccountRejectedScreen() {
  const { profile, signOut } = useAuth();
  return (
    <AuthShell title="Registration not approved" subtitle="HR reviewed your registration and could not approve it at this time.">
      <View style={styles.card}><Text style={styles.label}>REVIEW NOTE</Text><Text style={styles.reason}>{profile?.rejection_reason || 'Please contact your HR team for more information.'}</Text></View>
      <ActionButton label="Sign out" onPress={() => void signOut()} />
      <ActionButton label="Return to welcome" variant="secondary" onPress={() => { void signOut(); router.replace('/(auth)/welcome'); }} />
    </AuthShell>
  );
}

const styles = StyleSheet.create({ card: { backgroundColor: '#FBEAEA', borderRadius: 18, padding: 20, gap: 10 }, label: { color: '#A34444', fontSize: 12, fontWeight: '800', letterSpacing: 1.5 }, reason: { color: '#563838', fontSize: 15, lineHeight: 23 } });
