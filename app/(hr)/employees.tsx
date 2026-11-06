import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { InlineMessage } from '@/components/InlineMessage';
import { supabase } from '@/lib/supabase';

type EmployeeProfile = { email: string; display_name: string | null; account_status: string; role: string };
type EmployeeRow = { id: string; employee_number: string; first_name: string; last_name: string; department: string | null; job_title: string | null; employment_status: string; profiles?: EmployeeProfile[] | null };

export default function EmployeeDirectoryScreen() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async (): Promise<void> => { setError(null); const { data, error: queryError } = await supabase.from('employees').select('id, employee_number, first_name, last_name, department, job_title, employment_status, profiles!inner(email, display_name, account_status, role)').order('last_name'); if (queryError) { setError('We could not load the employee directory.'); } else setEmployees((data || []) as EmployeeRow[]); setLoading(false); }, []);
  useEffect(() => { void load(); }, [load]);
  const refresh = async (): Promise<void> => { setRefreshing(true); await load(); setRefreshing(false); };
  return <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />}><Text style={styles.eyebrow}>PEOPLE</Text><Text style={styles.title}>Employee directory</Text>{error ? <InlineMessage message={error} /> : null}{loading ? <Text style={styles.empty}>Loading employees...</Text> : employees.length === 0 ? <Text style={styles.empty}>No employees have been approved yet.</Text> : employees.map((employee) => { const profile = Array.isArray(employee.profiles) ? employee.profiles[0] : employee.profiles; return <View key={employee.id} style={styles.card}><View style={styles.row}><Text style={styles.name}>{profile?.display_name || `${employee.first_name} ${employee.last_name}`}</Text><Text style={styles.status}>{employee.employment_status}</Text></View><Text style={styles.email}>{profile?.email}</Text><Text style={styles.detail}>{employee.employee_number} · {employee.job_title || 'Role not set'}</Text><Text style={styles.detail}>{employee.department || 'Department not set'}</Text></View>; })}</ScrollView>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#F6F8FA' }, content: { padding: 24, paddingTop: 64, gap: 14 }, eyebrow: { color: '#4E7B78', fontSize: 12, fontWeight: '800', letterSpacing: 2 }, title: { color: '#142A33', fontSize: 32, fontWeight: '800', marginBottom: 4 }, card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, gap: 7, borderWidth: 1, borderColor: '#E1E8EA' }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, name: { color: '#143B4A', fontSize: 18, fontWeight: '800', flex: 1 }, status: { color: '#236D63', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' }, email: { color: '#5E6D73', fontSize: 14 }, detail: { color: '#6C7B80', fontSize: 14 }, empty: { color: '#6C7B80', fontSize: 15, lineHeight: 22 } });
