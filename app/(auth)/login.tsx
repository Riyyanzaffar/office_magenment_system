import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { ActionButton } from '@/components/ActionButton';
import { AuthShell } from '@/components/AuthShell';
import { FormField } from '@/components/FormField';
import { InlineMessage } from '@/components/InlineMessage';
import { describeSignInError } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (): Promise<void> => {
    setError(null);
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    setLoading(false);
    if (signInError) {
      setError(describeSignInError(signInError));
      return;
    }
    router.replace('/');
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue to your workplace.">
      {error ? <InlineMessage message={error} /> : null}
      <FormField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <FormField label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />
      <Link href="/(auth)/forgot-password" style={styles.link}>Forgot password?</Link>
      <ActionButton label="Sign in" onPress={() => void submit()} loading={loading} />
      <Text style={styles.accountText}>New employee? <Link href="/(auth)/register" style={styles.link}>Create an account</Link></Text>
    </AuthShell>
  );
}

const styles = StyleSheet.create({ link: { color: '#236D63', fontSize: 14, fontWeight: '800', textAlign: 'right' }, accountText: { color: '#6C7B80', textAlign: 'center', fontSize: 14 } });
