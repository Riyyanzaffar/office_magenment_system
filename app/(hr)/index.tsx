import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ActionButton } from '@/components/ActionButton';
import { InlineMessage } from '@/components/InlineMessage';
import { reviewEmployeeRegistration } from '@/lib/api';
import { supabase } from '@/lib/supabase';

type PendingRegistration = { id: string; display_name: string | null; email: string; created_at: string; employee?: { employee_number: string; job_title: string | null; first_name: string; last_name: string } };

export default function HrReviewScreen() {
  const [registrations, setRegistrations] = useState<PendingRegistration[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setError(null);
    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id, display_name, email, created_at').eq('account_status', 'pending').order('created_at', { ascending: true });
    if (profilesError) { setError('We could not load pending registrations.'); setLoading(false); return; }
    const rows = (profiles || []) as PendingRegistration[];
    const ids = rows.map((row) => row.id);
    if (!ids.length) { setRegistrations([]); setLoading(false); return; }
    const { data: employees, error: employeeError } = await supabase.from('employees').select('profile_id, employee_number, job_title, first_name, last_name').in('profile_id', ids);
    if (employeeError) { setError('We could not load employee details.'); setLoading(false); return; }
    const employeeByProfile = new Map((employees || []).map((employee) => [employee.profile_id as string, employee]));
    setRegistrations(rows.map((row) => ({ ...row, employee: employeeByProfile.get(row.id) as PendingRegistration['employee'] })));
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const refresh = async (): Promise<void> => { setRefreshing(true); await load(); setRefreshing(false); };
  const review = async (id: string, decision: 'approved' | 'rejected'): Promise<void> => {
    const reason = reasons[id]?.trim() || '';
    if (decision === 'rejected' && reason.length < 3) { setError('A reason is required when rejecting a registration.'); return; }
    setBusyId(id); setError(null); setMessage(null);
    try { await reviewEmployeeRegistration(id, decision, reason); setMessage(decision === 'approved' ? 'Registration approved.' : 'Registration rejected.'); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to complete the review.'); } finally { setBusyId(null); }
  };

  return <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />}><Text style={styles.eyebrow}>HR WORKSPACE</Text><Text style={styles.title}>Registration review</Text><Text style={styles.subtitle}>Approve trusted employee access or record a clear reason for rejection.</Text>{error ? <InlineMessage message={error} /> : null}{message ? <InlineMessage message={message} tone="success" /> : null}{loading ? <Text style={styles.empty}>Loading registrations...</Text> : registrations.length === 0 ? <View style={styles.emptyCard}><Text style={styles.emptyTitle}>No pending registrations</Text><Text style={styles.empty}>New employee requests will appear here.</Text></View> : registrations.map((item) => <View key={item.id} style={styles.card}><Text style={styles.name}>{item.display_name || `${item.employee?.first_name || ''} ${item.employee?.last_name || ''}`}</Text><Text style={styles.detail}>{item.email}</Text><Text style={styles.detail}>Employee ID: {item.employee?.employee_number || 'Not available'}</Text><Text style={styles.detail}>Designation: {item.employee?.job_title || 'Not available'}</Text><TextInput placeholder="Reason required for rejection" placeholderTextColor="#8A989D" value={reasons[item.id] || ''} onChangeText={(value) => setReasons((current) => ({ ...current, [item.id]: value }))} style={styles.reason} multiline /><View style={styles.actions}><View style={styles.action}><ActionButton label="Approve" onPress={() => void review(item.id, 'approved')} loading={busyId === item.id} /></View><View style={styles.action}><ActionButton label="Reject" variant="danger" onPress={() => void review(item.id, 'rejected')} loading={busyId === item.id} /></View></View></View>)}</ScrollView>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#F6F8FA' }, content: { padding: 24, paddingTop: 64, gap: 14 }, eyebrow: { color: '#4E7B78', fontSize: 12, fontWeight: '800', letterSpacing: 2 }, title: { color: '#142A33', fontSize: 32, fontWeight: '800' }, subtitle: { color: '#5E6D73', fontSize: 16, lineHeight: 24 }, card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, gap: 8, borderWidth: 1, borderColor: '#E1E8EA' }, name: { color: '#143B4A', fontSize: 19, fontWeight: '800' }, detail: { color: '#5E6D73', fontSize: 14 }, reason: { minHeight: 72, borderWidth: 1, borderColor: '#D5DEE1', borderRadius: 12, padding: 12, color: '#142A33', textAlignVertical: 'top', marginTop: 6 }, actions: { flexDirection: 'row', gap: 10, marginTop: 4 }, action: { flex: 1 }, emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 24, gap: 8 }, emptyTitle: { color: '#143B4A', fontSize: 18, fontWeight: '800' }, empty: { color: '#6C7B80', fontSize: 15, lineHeight: 22 } });
