import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '@/components/ActionButton';
import { ChoiceChips } from '@/components/ChoiceChips';
import { FormField } from '@/components/FormField';
import { InlineMessage } from '@/components/InlineMessage';
import { ModalSheet } from '@/components/ModalSheet';
import type { FormErrors } from '@/lib/company';
import {
  Department,
  DepartmentForm,
  EmployeeOption,
  departmentToForm,
  saveDepartment,
  validateDepartmentForm,
} from '@/lib/organization';

type DepartmentEditorProps = {
  visible: boolean;
  companyId: string;
  department: Department | null;
  employees: EmployeeOption[];
  onClose: () => void;
  onSaved: () => void;
};

export function DepartmentEditor({ visible, companyId, department, employees, onClose, onSaved }: DepartmentEditorProps) {
  const [form, setForm] = useState<DepartmentForm>(departmentToForm(department));
  const [errors, setErrors] = useState<FormErrors<DepartmentForm>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setForm(departmentToForm(department));
    setErrors({});
    setMessage(null);
  }, [visible, department]);

  const submit = async () => {
    const { errors: nextErrors, payload } = validateDepartmentForm(form);
    setErrors(nextErrors);
    if (!payload) {
      setMessage('Please correct the highlighted fields.');
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await saveDepartment(companyId, department?.id ?? null, payload);
      onSaved();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalSheet visible={visible} title={department ? 'Edit department' : 'Add department'} onClose={onClose}>
      <FormField label="Department name" value={form.name} onChangeText={(name) => setForm((prev) => ({ ...prev, name }))} />
      {errors.name ? <Text style={styles.fieldError}>{errors.name}</Text> : null}
      <FormField label="Description" value={form.description} onChangeText={(description) => setForm((prev) => ({ ...prev, description }))} multiline />
      <View style={styles.group}>
        <Text style={styles.label}>Department head</Text>
        <ChoiceChips
          options={[{ value: '', label: 'None' }, ...employees.map((employee) => ({ value: employee.id, label: employee.label }))]}
          selected={[form.head_employee_id]}
          onPress={(head_employee_id) => setForm((prev) => ({ ...prev, head_employee_id }))}
        />
      </View>
      <View style={styles.group}>
        <Text style={styles.label}>Status</Text>
        <ChoiceChips
          options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
          selected={[form.is_active ? 'active' : 'inactive']}
          onPress={(value) => setForm((prev) => ({ ...prev, is_active: value === 'active' }))}
        />
      </View>
      {message ? <InlineMessage message={message} /> : null}
      <ActionButton label={department ? 'Save changes' : 'Add department'} onPress={() => void submit()} loading={saving} />
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  label: { color: '#29424B', fontSize: 13, fontWeight: '700' },
  fieldError: { color: '#A34444', fontSize: 13, marginTop: -8 },
});
