import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '@/components/ActionButton';
import { ChoiceChips } from '@/components/ChoiceChips';
import { FormField } from '@/components/FormField';
import { InlineMessage } from '@/components/InlineMessage';
import { ModalSheet } from '@/components/ModalSheet';
import type { FormErrors } from '@/lib/company';
import {
  Designation,
  DesignationForm,
  Department,
  EmploymentCategory,
  designationToForm,
  employmentCategoryLabels,
  saveDesignation,
  validateDesignationForm,
} from '@/lib/organization';

type DesignationEditorProps = {
  visible: boolean;
  companyId: string;
  designation: Designation | null;
  departments: Department[];
  onClose: () => void;
  onSaved: () => void;
};

const levelOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({ value: String(n), label: String(n) }));
const categoryOptions = (Object.keys(employmentCategoryLabels) as EmploymentCategory[]).map((value) => ({
  value,
  label: employmentCategoryLabels[value],
}));

export function DesignationEditor({ visible, companyId, designation, departments, onClose, onSaved }: DesignationEditorProps) {
  const [form, setForm] = useState<DesignationForm>(() => designationToForm(designation, departments[0]?.id ?? ''));
  const [errors, setErrors] = useState<FormErrors<DesignationForm>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setForm(designationToForm(designation, departments[0]?.id ?? ''));
    setErrors({});
    setMessage(null);
  }, [visible, designation, departments]);

  const submit = async () => {
    const { errors: nextErrors, payload } = validateDesignationForm(form);
    setErrors(nextErrors);
    if (!payload) {
      setMessage('Please correct the highlighted fields.');
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await saveDesignation(companyId, designation?.id ?? null, payload);
      onSaved();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalSheet visible={visible} title={designation ? 'Edit designation' : 'Add designation'} onClose={onClose}>
      <FormField label="Designation name" value={form.name} onChangeText={(name) => setForm((prev) => ({ ...prev, name }))} />
      {errors.name ? <Text style={styles.fieldError}>{errors.name}</Text> : null}

      <View style={styles.group}>
        <Text style={styles.label}>Department</Text>
        {departments.length === 0 ? (
          <Text style={styles.hint}>Add a department first before creating a designation.</Text>
        ) : (
          <ChoiceChips
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
            selected={[form.department_id]}
            onPress={(department_id) => setForm((prev) => ({ ...prev, department_id }))}
          />
        )}
        {errors.department_id ? <Text style={styles.fieldError}>{errors.department_id}</Text> : null}
      </View>

      <FormField label="Job description" value={form.job_description} onChangeText={(job_description) => setForm((prev) => ({ ...prev, job_description }))} multiline />

      <View style={styles.group}>
        <Text style={styles.label}>Reporting level (1 = most senior)</Text>
        <ChoiceChips
          options={levelOptions}
          selected={[form.reporting_level]}
          onPress={(reporting_level) => setForm((prev) => ({ ...prev, reporting_level }))}
        />
        {errors.reporting_level ? <Text style={styles.fieldError}>{errors.reporting_level}</Text> : null}
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>Employment category</Text>
        <ChoiceChips
          options={categoryOptions}
          selected={[form.employment_category]}
          onPress={(employment_category) => setForm((prev) => ({ ...prev, employment_category: employment_category as EmploymentCategory }))}
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
      <ActionButton
        label={designation ? 'Save changes' : 'Add designation'}
        onPress={() => void submit()}
        loading={saving}
        disabled={departments.length === 0}
      />
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  label: { color: '#29424B', fontSize: 13, fontWeight: '700' },
  hint: { color: '#5E6D73', fontSize: 13, lineHeight: 18 },
  fieldError: { color: '#A34444', fontSize: 13, marginTop: -8 },
});
