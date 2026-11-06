import { supabase } from '@/lib/supabase';

export type RegistrationInput = {
  fullName: string;
  employeeId: string;
  designation: string;
  email: string;
  password: string;
};

export async function registerEmployee(input: RegistrationInput): Promise<void> {
  const { data, error } = await supabase.functions.invoke('register-employee', {
    body: input,
  });

  if (error || !data?.success) {
    throw new Error(data?.error ?? 'Unable to complete registration.');
  }
}

export async function reviewEmployeeRegistration(
  profileId: string,
  decision: 'approved' | 'rejected',
  reason?: string,
): Promise<void> {
  const { data, error } = await supabase.functions.invoke('review-employee-registration', {
    body: { profileId, decision, reason },
  });

  if (error || !data?.success) {
    throw new Error(data?.error ?? 'Unable to complete the review.');
  }
}

export type HRUserInput = {
  fullName: string;
  email: string;
  password: string;
};

export async function createHRUser(input: HRUserInput): Promise<void> {
  const { data, error } = await supabase.functions.invoke('create-hr-user', {
    body: input,
  });

  if (error || !data?.success) {
    throw new Error(data?.error ?? 'Unable to create the HR account.');
  }
}

export type PendingRegistration = {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
};

export async function fetchPendingRegistrations(companyId: string): Promise<PendingRegistration[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, display_name, created_at')
    .eq('company_id', companyId)
    .eq('account_status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw new Error('Pending registrations could not be loaded.');
  return (data ?? []) as PendingRegistration[];
}

export type HRUser = {
  id: string;
  email: string;
  display_name: string | null;
  account_status: string;
  created_at: string;
};

export async function fetchHRUsers(companyId: string): Promise<HRUser[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, display_name, account_status, created_at')
    .eq('company_id', companyId)
    .eq('role', 'hr')
    .order('created_at', { ascending: false });
  if (error) throw new Error('HR accounts could not be loaded.');
  return (data ?? []) as HRUser[];
}

export async function setHRUserStatus(userId: string, status: 'active' | 'suspended'): Promise<void> {
  const { error } = await supabase.rpc('set_hr_account_status', {
    target_user_id: userId,
    new_status: status,
  });
  if (error) throw new Error('Account status could not be updated. ' + (error.message || ''));
}
