import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { ActionButton } from '@/components/ActionButton';
import { AuthShell } from '@/components/AuthShell';
import { useAuth } from '@/providers/AuthProvider';

export default function UnauthorizedScreen() {
  const { signOut, profileError } = useAuth();
  return (
    <AuthShell
      title={profileError ? 'Account could not be loaded' : 'Access unavailable'}
      subtitle={profileError ?? 'We could not verify the permissions for this account.'}
    >
      <Text style={styles.body}>Please sign out and try again. If the problem continues, contact your system administrator.</Text>
      <ActionButton label="Sign out" onPress={() => { void signOut(); router.replace('/(auth)/welcome'); }} />
    </AuthShell>
  );
}

const styles = StyleSheet.create({ body: { color: '#5E6D73', fontSize: 15, lineHeight: 23 } });
