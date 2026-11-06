import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { UserPlus, Mail, Shield } from 'lucide-react-native';

import { ActionButton } from '@/components/ActionButton';
import { FormField } from '@/components/FormField';
import { InlineMessage } from '@/components/InlineMessage';
import { ModalSheet } from '@/components/ModalSheet';
import { HRUser, createHRUser, fetchHRUsers, setHRUserStatus } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';

export default function HRUsersScreen() {
  const { profile } = useAuth();
  const companyId = profile?.company_id ?? null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<HRUser[]>([]);
  const [addVisible, setAddVisible] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!companyId) {
      setError('Your account is not linked to a company.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setUsers(await fetchHRUsers(companyId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'HR accounts could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const openAdd = () => {
    setName('');
    setEmail('');
    setPassword('');
    setFormError(null);
    setAddVisible(true);
  };

  const submitCreate = async () => {
    setFormError(null);
    if (name.trim().length < 2) {
      setFormError('Please enter a full name.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim().toLowerCase())) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }
    setSaving(true);
    try {
      await createHRUser({ fullName: name.trim(), email: email.trim().toLowerCase(), password });
      setAddVisible(false);
      void load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to create the HR account.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (user: HRUser) => {
    setActionError(null);
    const next = user.account_status === 'active' ? 'suspended' : 'active';
    try {
      await setHRUserStatus(user.id, next);
      void load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Status change failed.');
    }
  };

  if (loading && users.length === 0) {
    return <View style={styles.center}><ActivityIndicator color="#143B4A" size="large" /></View>;
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.eyebrow}>USER MANAGEMENT</Text>
          <Text style={styles.title}>HR Accounts</Text>
          <Text style={styles.subtitle}>Create and manage HR manager accounts for your company.</Text>
        </View>

        {error ? <InlineMessage message={error} /> : null}
        {actionError ? <InlineMessage message={actionError} /> : null}

        {users.length === 0 ? (
          <View style={styles.empty}>
            <UserPlus color="#809096" size={28} strokeWidth={2} />
            <Text style={styles.emptyTitle}>No HR accounts yet</Text>
            <Text style={styles.emptyHint}>Create an HR user to test the employee approval workflow.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {users.map((user) => (
              <View key={user.id} style={styles.card}>
                <View style={styles.cardLeft}>
                  <View style={styles.avatar}>
                    <Shield color="#143B4A" size={18} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={styles.cardName}>{user.display_name ?? 'Unnamed'}</Text>
                    <Text style={styles.cardEmail}>{user.email}</Text>
                    <View style={[styles.badge, user.account_status === 'active' ? styles.badgeActive : styles.badgeSuspended]}>
                      <Text style={[styles.badgeText, user.account_status === 'active' ? styles.badgeTextActive : styles.badgeTextSuspended]}>
                        {user.account_status === 'active' ? 'Active' : 'Suspended'}
                      </Text>
                    </View>
                  </View>
                </View>
                <Pressable
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.toggleBtn, pressed && styles.togglePressed]}
                  onPress={() => void toggleStatus(user)}
                >
                  <Text style={styles.toggleText}>{user.account_status === 'active' ? 'Suspend' : 'Activate'}</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.fabWrap}>
        <ActionButton label="Add HR User" onPress={openAdd} />
      </View>

      <ModalSheet visible={addVisible} title="Create HR User" onClose={() => setAddVisible(false)}>
        <View style={styles.notice}>
          <Mail color="#2F6B57" size={16} strokeWidth={2} />
          <Text style={styles.noticeText}>The HR user will be created with an active account and can sign in immediately.</Text>
        </View>
        <FormField label="Full name" value={name} onChangeText={setName} />
        <FormField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <FormField label="Password (min 8 characters)" value={password} onChangeText={setPassword} secureTextEntry />
        {formError ? <InlineMessage message={formError} /> : null}
        <ActionButton label="Create HR User" onPress={() => void submitCreate()} loading={saving} />
      </ModalSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F5EE' },
  content: { padding: 24, gap: 16, paddingBottom: 120 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F5EE' },
  header: { gap: 6, paddingTop: 8 },
  eyebrow: { color: '#2F6B57', fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  title: { color: '#142A33', fontSize: 28, lineHeight: 34, fontWeight: '800' },
  subtitle: { color: '#5E6D73', fontSize: 15, lineHeight: 22 },
  list: { gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E4E8E3' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#E3EBEE', justifyContent: 'center', alignItems: 'center' },
  cardName: { color: '#142A33', fontSize: 15, fontWeight: '800' },
  cardEmail: { color: '#5E6D73', fontSize: 13 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4 },
  badgeActive: { backgroundColor: '#DDF2E7' },
  badgeSuspended: { backgroundColor: '#F0E8E8' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeTextActive: { color: '#2F6B57' },
  badgeTextSuspended: { color: '#A34444' },
  toggleBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F0F4F1', borderWidth: 1, borderColor: '#C9D6D9' },
  togglePressed: { opacity: 0.7 },
  toggleText: { color: '#143B4A', fontSize: 13, fontWeight: '700' },
  empty: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 32, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#E4E8E3' },
  emptyTitle: { color: '#142A33', fontSize: 16, fontWeight: '800' },
  emptyHint: { color: '#5E6D73', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  fabWrap: { position: 'absolute', bottom: 24, left: 24, right: 24 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#E4F4EA', borderRadius: 12, padding: 14 },
  noticeText: { color: '#2F6B57', fontSize: 13, lineHeight: 18, flex: 1 },
});
