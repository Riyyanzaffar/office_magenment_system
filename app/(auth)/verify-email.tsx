import { Link, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { ActionButton } from '@/components/ActionButton';
import { AuthShell } from '@/components/AuthShell';
import { InlineMessage } from '@/components/InlineMessage';
import { supabase } from '@/lib/supabase';

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === 'string' ? params.email : '';
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resend = async (): Promise<void> => {
    if (!email) {
      setError('Please return to sign in and enter your email address.');
      return;
    }
    setError(null);
    setMessage(null);
    setLoading(true);
    const { error: resendError } = await supabase.auth.resend({ type: 'signup', email });
    setLoading(false);
    if (resendError) setError('We could not resend the verification email. Please try again later.');
    else setMessage('A new verification email has been sent.');
  };

  return (
    <AuthShell title="Check your email" subtitle={email ? `We sent a verification link to ${email}.` : 'Open the verification link sent to your email address.'}>
      {error ? <InlineMessage message={error} /> : null}
      {message ? <InlineMessage message={message} tone="success" /> : null}
      <Text style={styles.body}>After verifying your email, return here and sign in. HR approval is still required before you can enter the app.</Text>
      <ActionButton label="Resend verification email" variant="secondary" onPress={() => void resend()} loading={loading} />
      <ActionButton label="Go to sign in" onPress={() => router.replace('/(auth)/login')} />
      <Link href="/(auth)/welcome" style={styles.link}>Back to welcome</Link>
    </AuthShell>
  );
}

const styles = StyleSheet.create({ body: { color: '#5E6D73', fontSize: 15, lineHeight: 23 }, link: { color: '#236D63', fontSize: 14, fontWeight: '800', textAlign: 'center', marginTop: 6 } });
