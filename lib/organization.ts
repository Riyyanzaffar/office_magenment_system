import { supabase } from '@/lib/supabase';
import type { FormErrors } from '@/lib/company';

export type EmploymentCategory = 'full_time' | 'part_time' | 'contract' | 'intern';

export const employmentCategoryLabels: Record<EmploymentCategory, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  intern: 'Intern',
};

export type Department = {
  id: string;
  name: string;
  description: string | null;
  head_employee_id: string | null;
  is_active: boolean;
  employee_count: number;
  designation_count: number;
};

export type Designation = {
  id: string;
  department_id: string;
  name: string;
  job_description: string | null;
  reporting_level: number;
  employment_category: EmploymentCategory;
  is_active: boolean;
  employee_count: number;
};

export type EmployeeOption = { id: string; label: string };

export type DepartmentForm = {
  name: string;
  description: string;
  head_employee_id: string;
  is_active: boolean;
};

export type DesignationForm = {
  name: string;
  department_id: string;
  job_description: string;
  reporting_level: string;
  employment_category: EmploymentCategory;
  is_active: boolean;
};

const departmentColumns = 'id, name, description, head_employee_id, is_active';
const designationColumns = 'id, department_id, name, job_description, reporting_level, employment_category, is_active';

function countBy(values: (string | null)[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

export async function fetchEmployeeOptions(companyId: string): Promise<EmployeeOption[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('id, first_name, last_name, employee_number')
    .eq('company_id', companyId)
    .eq('employment_status', 'active')
    .order('first_name', { ascending: true })
    .limit(500);
  if (error) throw new Error('Employees could not be loaded. Please try again.');
  return (data ?? []).map((row) => ({
    id: row.id as string,
    label: `${row.first_name as string} ${row.last_name as string} (${row.employee_number as string})`,
  }));
}

export async function fetchDepartments(companyId: string): Promise<Department[]> {
  const [departmentsResult, employeesResult, designationsResult] = await Promise.all([
    supabase.from('departments').select(departmentColumns).eq('company_id', companyId).order('name', { ascending: true }),
    supabase.from('employees').select('department_id').eq('company_id', companyId),
    supabase.from('designations').select('department_id').eq('company_id', companyId),
  ]);
  if (departmentsResult.error || employeesResult.error || designationsResult.error) {
    throw new Error('Departments could not be loaded. Please try again.');
  }

  const employeeCounts = countBy((employeesResult.data ?? []).map((row) => row.department_id as string | null));
  const designationCounts = countBy((designationsResult.data ?? []).map((row) => row.department_id as string | null));

  return (departmentsResult.data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    description: row.description as string | null,
    head_employee_id: row.head_employee_id as string | null,
    is_active: row.is_active as boolean,
    employee_count: employeeCounts.get(row.id as string) ?? 0,
    designation_count: designationCounts.get(row.id as string) ?? 0,
  }));
}

export async function fetchDesignations(companyId: string): Promise<Designation[]> {
  const [designationsResult, employeesResult] = await Promise.all([
    supabase.from('designations').select(designationColumns).eq('company_id', companyId).order('name', { ascending: true }),
    supabase.from('employees').select('designation_id').eq('company_id', companyId),
  ]);
  if (designationsResult.error || employeesResult.error) {
    throw new Error('Designations could not be loaded. Please try again.');
  }

  const employeeCounts = countBy((employeesResult.data ?? []).map((row) => row.designation_id as string | null));

  return (designationsResult.data ?? []).map((row) => ({
    id: row.id as string,
    department_id: row.department_id as string,
    name: row.name as string,
    job_description: row.job_description as string | null,
    reporting_level: row.reporting_level as number,
    employment_category: row.employment_category as EmploymentCategory,
    is_active: row.is_active as boolean,
    employee_count: employeeCounts.get(row.id as string) ?? 0,
  }));
}

export function departmentToForm(department: Department | null): DepartmentForm {
  return {
    name: department?.name ?? '',
    description: department?.description ?? '',
    head_employee_id: department?.head_employee_id ?? '',
    is_active: department?.is_active ?? true,
  };
}

export function designationToForm(designation: Designation | null, defaultDepartmentId: string): DesignationForm {
  return {
    name: designation?.name ?? '',
    department_id: designation?.department_id ?? defaultDepartmentId,
    job_description: designation?.job_description ?? '',
    reporting_level: designation ? String(designation.reporting_level) : '3',
    employment_category: designation?.employment_category ?? 'full_time',
    is_active: designation?.is_active ?? true,
  };
}

export function validateDepartmentForm(form: DepartmentForm): { errors: FormErrors<DepartmentForm>; payload: Omit<Department, 'id' | 'employee_count' | 'designation_count'> | null } {
  const name = form.name.trim();
  const errors: FormErrors<DepartmentForm> = {};
  if (!name) errors.name = 'Department name is required.';
  else if (name.length > 100) errors.name = 'Department name must be 100 characters or fewer.';
  if (Object.keys(errors).length > 0) return { errors, payload: null };
  return {
    errors,
    payload: {
      name,
      description: form.description.trim() || null,
      head_employee_id: form.head_employee_id || null,
      is_active: form.is_active,
    },
  };
}

export function validateDesignationForm(form: DesignationForm): { errors: FormErrors<DesignationForm>; payload: Omit<Designation, 'id' | 'employee_count'> | null } {
  const name = form.name.trim();
  const level = Number(form.reporting_level);
  const errors: FormErrors<DesignationForm> = {};
  if (!name) errors.name = 'Designation name is required.';
  else if (name.length > 100) errors.name = 'Designation name must be 100 characters or fewer.';
  if (!form.department_id) errors.department_id = 'Choose a department.';
  if (!Number.isInteger(level) || level < 1 || level > 10) errors.reporting_level = 'Reporting level must be between 1 (most senior) and 10.';
  if (Object.keys(errors).length > 0) return { errors, payload: null };
  return {
    errors,
    payload: {
      name,
      department_id: form.department_id,
      job_description: form.job_description.trim() || null,
      reporting_level: level,
      employment_category: form.employment_category,
      is_active: form.is_active,
    },
  };
}

function friendlySaveError(code: string | undefined, subject: string): string {
  if (code === '23505') return `A ${subject} with this name already exists.`;
  if (code === '23503') return 'One of the selected records is no longer valid. Please refresh and try again.';
  return `${subject[0].toUpperCase()}${subject.slice(1)} could not be saved. Please try again.`;
}

export async function saveDepartment(companyId: string, existingId: string | null, payload: Omit<Department, 'id' | 'employee_count' | 'designation_count'>): Promise<void> {
  const query = existingId
    ? supabase.from('departments').update(payload).eq('id', existingId)
    : supabase.from('departments').insert({ ...payload, company_id: companyId });
  const { data, error } = await query.select('id').maybeSingle();
  if (error) throw new Error(friendlySaveError(error.code, 'department'));
  if (!data) throw new Error('You do not have permission to change departments.');
}

export async function saveDesignation(companyId: string, existingId: string | null, payload: Omit<Designation, 'id' | 'employee_count'>): Promise<void> {
  const query = existingId
    ? supabase.from('designations').update(payload).eq('id', existingId)
    : supabase.from('designations').insert({ ...payload, company_id: companyId });
  const { data, error } = await query.select('id').maybeSingle();
  if (error) throw new Error(friendlySaveError(error.code, 'designation'));
  if (!data) throw new Error('You do not have permission to change designations.');
}
