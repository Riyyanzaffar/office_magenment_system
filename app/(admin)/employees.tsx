import { StyleSheet, Text, View } from 'react-native';
import { UserPlus } from 'lucide-react-native';

import { ActionButton } from '@/components/ActionButton';
import { useAuth } from '@/providers/AuthProvider';
import { router } from 'expo-router';

export default function EmployeeManagementScreen() {
  const { signOut } = useAuth();
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>WORKFORCE</Text>
        <Text style={styles.title}>Employee management</Text>
        <Text style={styles.subtitle}>Employee onboarding, directories and role assignment will be added in the next milestone.</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <UserPlus color="#143B4A" size={24} strokeWidth={2} />
        </View>
        <Text style={styles.cardTitle}>Coming soon</Text>
        <Text style={styles.cardText}>
          Multi-step employee onboarding, the employee directory and user role management are part of the next phase.
          Employee self-registration remains available through the sign-up screen.
        </Text>
      </View>

      <ActionButton label="Sign out" variant="secondary" onPress={() => { void signOut(); router.replace('/(auth)/welcome'); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F5EE', padding: 24, gap: 20, paddingBottom: 48 },
  header: { gap: 6, paddingTop: 8 },
  eyebrow: { color: '#2F6B57', fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  title: { color: '#142A33', fontSize: 28, lineHeight: 34, fontWeight: '800' },
  subtitle: { color: '#5E6D73', fontSize: 15, lineHeight: 22 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, gap: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E4E8E3' },
  iconWrap: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#E3EBEE', justifyContent: 'center', alignItems: 'center' },
  cardTitle: { color: '#142A33', fontSize: 18, fontWeight: '800' },
  cardText: { color: '#5E6D73', fontSize: 14, lineHeight: 22, textAlign: 'center' },
});
