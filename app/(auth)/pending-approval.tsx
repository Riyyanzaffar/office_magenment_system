import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '@/components/ActionButton';
import { AuthShell } from '@/components/AuthShell';
import { useAuth } from '@/providers/AuthProvider';

export default function PendingApprovalScreen() {
  const { signOut, profile } = useAuth();
  return (
    <AuthShell title="Approval in progress" subtitle="Your email is verified, but HR still needs to approve your employee account.">
      <View style={styles.card}><Text style={styles.status}>PENDING REVIEW</Text><Text style={styles.body}>You will be able to access your workplace once an authorized HR or Admin reviewer approves your registration.</Text>{profile?.email ? <Text style={styles.email}>{profile.email}</Text> : null}</View>
      <ActionButton label="Check again" variant="secondary" onPress={() => router.replace('/')} />
      <ActionButton label="Sign out" onPress={() => void signOut()} />
    </AuthShell>
  );
}

const styles = StyleSheet.create({ card: { backgroundColor: '#E8F1F3', borderRadius: 18, padding: 20, gap: 10 }, status: { color: '#236D63', fontSize: 12, fontWeight: '800', letterSpacing: 1.5 }, body: { color: '#40555D', fontSize: 15, lineHeight: 23 }, email: { color: '#143B4A', fontWeight: '800' } });
