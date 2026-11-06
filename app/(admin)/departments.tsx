import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Plus, Search, Users, FileText } from 'lucide-react-native';

import { ActionButton } from '@/components/ActionButton';
import { ChoiceChips } from '@/components/ChoiceChips';
import { DepartmentEditor } from '@/components/DepartmentEditor';
import { InlineMessage } from '@/components/InlineMessage';
import { Department, EmployeeOption, fetchDepartments, fetchEmployeeOptions } from '@/lib/organization';
import { useAuth } from '@/providers/AuthProvider';

type StatusFilter = 'all' | 'active' | 'inactive';

export default function DepartmentsScreen() {
  const { profile } = useAuth();
  const companyId = profile?.company_id ?? null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [editing, setEditing] = useState<Department | null>(null);
  const [editorVisible, setEditorVisible] = useState(false);

  const load = useCallback(async () => {
    if (!companyId) {
      setError('Your account is not linked to a company.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [depts, emps] = await Promise.all([fetchDepartments(companyId), fetchEmployeeOptions(companyId)]);
      setDepartments(depts);
      setEmployees(emps);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Departments could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return departments.filter((dept) => {
      if (statusFilter === 'active' && !dept.is_active) return false;
      if (statusFilter === 'inactive' && dept.is_active) return false;
      if (term && !dept.name.toLowerCase().includes(term) && !(dept.description ?? '').toLowerCase().includes(term)) return false;
      return true;
    });
  }, [departments, search, statusFilter]);

  const openAdd = () => {
    setEditing(null);
    setEditorVisible(true);
  };

  const openEdit = (department: Department) => {
    setEditing(department);
    setEditorVisible(true);
  };

  if (loading && departments.length === 0) {
    return <View style={styles.center}><ActivityIndicator color="#143B4A" size="large" /></View>;
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.eyebrow}>ORGANIZATION</Text>
          <Text style={styles.title}>Departments</Text>
          <Text style={styles.subtitle}>Create and manage departments for your company.</Text>
        </View>

        {error ? <InlineMessage message={error} /> : null}

        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <Search color="#8A989D" size={18} strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search departments"
              placeholderTextColor="#8A989D"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        <ChoiceChips
          options={[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
          selected={[statusFilter]}
          onPress={(value) => setStatusFilter(value as StatusFilter)}
        />

        <View style={styles.list}>
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No departments found</Text>
              <Text style={styles.emptyHint}>Try a different search or add a new department.</Text>
            </View>
          ) : (
            filtered.map((dept) => (
              <Pressable key={dept.id} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={() => openEdit(dept)}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardName}>{dept.name}</Text>
                  <View style={[styles.badge, dept.is_active ? styles.badgeActive : styles.badgeInactive]}>
                    <Text style={[styles.badgeText, dept.is_active ? styles.badgeTextActive : styles.badgeTextInactive]}>
                      {dept.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                {dept.description ? <Text style={styles.cardDescription}>{dept.description}</Text> : null}
                <View style={styles.cardStats}>
                  <View style={styles.statItem}>
                    <Users color="#5E6D73" size={14} strokeWidth={2} />
                    <Text style={styles.statText}>{dept.employee_count} employees</Text>
                  </View>
                  <View style={styles.statItem}>
                    <FileText color="#5E6D73" size={14} strokeWidth={2} />
                    <Text style={styles.statText}>{dept.designation_count} designations</Text>
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.fabWrap}>
        <ActionButton label="Add department" onPress={openAdd} />
      </View>

      <DepartmentEditor
        visible={editorVisible}
        companyId={companyId ?? ''}
        department={editing}
        employees={employees}
        onClose={() => setEditorVisible(false)}
        onSaved={() => {
          setEditorVisible(false);
          void load();
        }}
      />
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
  searchRow: { flexDirection: 'row' },
  searchWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D5DEE1', borderRadius: 14, paddingHorizontal: 16, minHeight: 52 },
  searchInput: { flex: 1, fontSize: 16, color: '#142A33' },
  list: { gap: 12 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, gap: 10, borderWidth: 1, borderColor: '#E4E8E3' },
  cardPressed: { opacity: 0.7 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  cardName: { color: '#142A33', fontSize: 17, fontWeight: '800', flex: 1, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeActive: { backgroundColor: '#DDF2E7' },
  badgeInactive: { backgroundColor: '#F0E8E8' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  badgeTextActive: { color: '#2F6B57' },
  badgeTextInactive: { color: '#A34444' },
  cardDescription: { color: '#5E6D73', fontSize: 14, lineHeight: 20 },
  cardStats: { flexDirection: 'row', gap: 18 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText: { color: '#5E6D73', fontSize: 13 },
  empty: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 32, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#E4E8E3' },
  emptyTitle: { color: '#142A33', fontSize: 16, fontWeight: '800' },
  emptyHint: { color: '#5E6D73', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  fabWrap: { position: 'absolute', bottom: 24, left: 24, right: 24 },
});
