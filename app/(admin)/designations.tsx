import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Search, Users } from 'lucide-react-native';

import { ActionButton } from '@/components/ActionButton';
import { ChoiceChips } from '@/components/ChoiceChips';
import { DesignationEditor } from '@/components/DesignationEditor';
import { InlineMessage } from '@/components/InlineMessage';
import {
  Department,
  Designation,
  employmentCategoryLabels,
  fetchDepartments,
  fetchDesignations,
} from '@/lib/organization';
import { useAuth } from '@/providers/AuthProvider';

export default function DesignationsScreen() {
  const { profile } = useAuth();
  const companyId = profile?.company_id ?? null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [editing, setEditing] = useState<Designation | null>(null);
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
      const [desigs, depts] = await Promise.all([fetchDesignations(companyId), fetchDepartments(companyId)]);
      setDesignations(desigs);
      setDepartments(depts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Designations could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const departmentName = useMemo(() => {
    const map = new Map(departments.map((d) => [d.id, d.name]));
    return (id: string) => map.get(id) ?? 'Unknown department';
  }, [departments]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return designations.filter((desig) => {
      if (departmentFilter !== 'all' && desig.department_id !== departmentFilter) return false;
      if (term && !desig.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [designations, search, departmentFilter]);

  const openAdd = () => {
    setEditing(null);
    setEditorVisible(true);
  };

  const openEdit = (designation: Designation) => {
    setEditing(designation);
    setEditorVisible(true);
  };

  if (loading && designations.length === 0) {
    return <View style={styles.center}><ActivityIndicator color="#143B4A" size="large" /></View>;
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.eyebrow}>ORGANIZATION</Text>
          <Text style={styles.title}>Designations</Text>
          <Text style={styles.subtitle}>Job titles linked to departments with reporting levels.</Text>
        </View>

        {error ? <InlineMessage message={error} /> : null}

        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <Search color="#8A989D" size={18} strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search designations"
              placeholderTextColor="#8A989D"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <ChoiceChips
            options={[{ value: 'all', label: 'All departments' }, ...departments.map((d) => ({ value: d.id, label: d.name }))]}
            selected={[departmentFilter]}
            onPress={(value) => setDepartmentFilter(value)}
          />
        </ScrollView>

        <View style={styles.list}>
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No designations found</Text>
              <Text style={styles.emptyHint}>Try a different search or add a new designation.</Text>
            </View>
          ) : (
            filtered.map((desig) => (
              <Pressable key={desig.id} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={() => openEdit(desig)}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardName}>{desig.name}</Text>
                  <View style={[styles.badge, desig.is_active ? styles.badgeActive : styles.badgeInactive]}>
                    <Text style={[styles.badgeText, desig.is_active ? styles.badgeTextActive : styles.badgeTextInactive]}>
                      {desig.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardDepartment}>{departmentName(desig.department_id)}</Text>
                <View style={styles.cardStats}>
                  <View style={styles.statItem}>
                    <Users color="#5E6D73" size={14} strokeWidth={2} />
                    <Text style={styles.statText}>{desig.employee_count} employees</Text>
                  </View>
                  <Text style={styles.statText}>Level {desig.reporting_level}</Text>
                  <Text style={styles.statText}>{employmentCategoryLabels[desig.employment_category]}</Text>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.fabWrap}>
        <ActionButton label="Add designation" onPress={openAdd} />
      </View>

      <DesignationEditor
        visible={editorVisible}
        companyId={companyId ?? ''}
        designation={editing}
        departments={departments}
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
  filterRow: { paddingRight: 24 },
  list: { gap: 12 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, gap: 8, borderWidth: 1, borderColor: '#E4E8E3' },
  cardPressed: { opacity: 0.7 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  cardName: { color: '#142A33', fontSize: 17, fontWeight: '800', flex: 1, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeActive: { backgroundColor: '#DDF2E7' },
  badgeInactive: { backgroundColor: '#F0E8E8' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  badgeTextActive: { color: '#2F6B57' },
  badgeTextInactive: { color: '#A34444' },
  cardDepartment: { color: '#2F6B57', fontSize: 14, fontWeight: '700' },
  cardStats: { flexDirection: 'row', gap: 18, flexWrap: 'wrap' },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText: { color: '#5E6D73', fontSize: 13 },
  empty: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 32, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#E4E8E3' },
  emptyTitle: { color: '#142A33', fontSize: 16, fontWeight: '800' },
  emptyHint: { color: '#5E6D73', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  fabWrap: { position: 'absolute', bottom: 24, left: 24, right: 24 },
});
