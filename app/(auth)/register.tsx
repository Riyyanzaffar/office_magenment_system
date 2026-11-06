import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { ActionButton } from '@/components/ActionButton';
import { AuthShell } from '@/components/AuthShell';
import { FormField } from '@/components/FormField';
import { InlineMessage } from '@/components/InlineMessage';
import { registerEmployee } from '@/lib/api';

export default function RegisterScreen() {
  const [form, setForm] = useState({ fullName: '', employeeId: '', designation: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const update = (key: keyof typeof form, value: string): void => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (): Promise<void> => {
    setError(null);
    setLoading(true);
    try {
      await registerEmployee(form);
      router.replace({ pathname: '/(auth)/verify-email', params: { email: form.email.trim().toLowerCase() } });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to complete registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Join your workplace" subtitle="Register as an employee. HR will review your details before access is approved.">
      {error ? <InlineMessage message={error} /> : null}
      <FormField label="Full name" value={form.fullName} onChangeText={(value) => update('fullName', value)} autoCapitalize="words" />
      <FormField label="Employee ID" value={form.employeeId} onChangeText={(value) => update('employeeId', value)} autoCapitalize="characters" />
      <FormField label="Designation" value={form.designation} onChangeText={(value) => update('designation', value)} />
      <FormField label="Email" value={form.email} onChangeText={(value) => update('email', value)} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <FormField label="Password" value={form.password} onChangeText={(value) => update('password', value)} secureTextEntry autoComplete="new-password" />
      <Text style={styles.hint}>Use at least 8 characters. Your account will start with Employee access and Pending approval status.</Text>
      <ActionButton label="Submit registration" onPress={() => void submit()} loading={loading} />
      <Text style={styles.accountText}>Already registered? <Link href="/(auth)/login" style={styles.link}>Sign in</Link></Text>
    </AuthShell>
  );
}

const styles = StyleSheet.create({ hint: { color: '#6C7B80', fontSize: 13, lineHeight: 19 }, accountText: { color: '#6C7B80', textAlign: 'center', fontSize: 14 }, link: { color: '#236D63', fontWeight: '800' } });
