import { Link, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '@/components/ActionButton';
import { AuthShell } from '@/components/AuthShell';

export default function WelcomeScreen() {
  return (
    <AuthShell title="Work, organized." subtitle="A calmer way to manage attendance, people, approvals, and daily work.">
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your workplace, in one place</Text>
        <Text style={styles.cardText}>Secure access for employees, HR teams, and administrators.</Text>
      </View>
      <ActionButton label="Sign in" onPress={() => router.push('/(auth)/login')} />
      <ActionButton label="Register as an employee" variant="secondary" onPress={() => router.push('/(auth)/register')} />
      <View style={styles.footer}><Text style={styles.footerText}>By continuing, you agree to follow your company policies.</Text></View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#143B4A', borderRadius: 22, padding: 22, marginBottom: 8 },
  cardTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginBottom: 8 },
  cardText: { color: '#CFE2E5', fontSize: 15, lineHeight: 22 },
  footer: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 8 },
  footerText: { color: '#7A898E', fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
