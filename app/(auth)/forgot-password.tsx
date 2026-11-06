import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { ActionButton } from '@/components/ActionButton';
import { AuthShell } from '@/components/AuthShell';
import { FormField } from '@/components/FormField';
import { InlineMessage } from '@/components/InlineMessage';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (): Promise<void> => {
    setError(null);
    setLoading(true);
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/(auth)/reset-password` : 'myapp:///(auth)/reset-password';
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });
    setLoading(false);
    if (resetError) {
      setError('We could not process that request. Please try again later.');
      return;
    }
    setSent(true);
  };

  return (
    <AuthShell title="Reset your password" subtitle="Enter your email and we will send instructions if an account is registered.">
      {error ? <InlineMessage message={error} /> : null}
      {sent ? <InlineMessage message="If that email is registered, reset instructions have been sent." tone="success" /> : null}
      <FormField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <ActionButton label="Send reset instructions" onPress={() => void submit()} loading={loading} disabled={sent} />
      <Text style={styles.footer}>For your security, the same message is shown whether or not the account exists.</Text>
      <Link href="/(auth)/login" style={styles.link}>Back to sign in</Link>
    </AuthShell>
  );
}

const styles = StyleSheet.create({ footer: { color: '#6C7B80', fontSize: 13, lineHeight: 19, textAlign: 'center' }, link: { color: '#236D63', fontSize: 14, fontWeight: '800', textAlign: 'center' } });
