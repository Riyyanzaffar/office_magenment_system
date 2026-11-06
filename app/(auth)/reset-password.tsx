import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { ActionButton } from '@/components/ActionButton';
import { AuthShell } from '@/components/AuthShell';
import { FormField } from '@/components/FormField';
import { InlineMessage } from '@/components/InlineMessage';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (): Promise<void> => {
    setError(null);
    if (password.length < 8 || password !== confirmation) {
      setError('Use at least 8 characters and make sure both passwords match.');
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError('We could not update your password. Please request a new reset email.');
      return;
    }
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  return (
    <AuthShell title="Choose a new password" subtitle="Create a new password for your account.">
      {error ? <InlineMessage message={error} /> : null}
      <FormField label="New password" value={password} onChangeText={setPassword} secureTextEntry />
      <FormField label="Confirm password" value={confirmation} onChangeText={setConfirmation} secureTextEntry />
      <ActionButton label="Update password" onPress={() => void submit()} loading={loading} />
      <Text style={styles.note}>Your reset link must be opened in this app to complete the change.</Text>
    </AuthShell>
  );
}

const styles = StyleSheet.create({ note: { color: '#6C7B80', fontSize: 13, lineHeight: 19, textAlign: 'center' } });
