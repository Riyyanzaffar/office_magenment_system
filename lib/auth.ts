import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'hr' | 'employee';
export type AccountStatus = 'pending' | 'active' | 'rejected' | 'suspended' | 'deactivated';

export type Profile = {
  id: string;
  company_id: string | null;
  email: string;
  display_name: string | null;
  role: UserRole;
  account_status: AccountStatus;
  rejection_reason: string | null;
};

export function describeSignInError(error: unknown): string {
  if (error instanceof AuthApiError) {
    if (error.code === 'invalid_credentials') {
      return 'Email or password is incorrect. Please try again.';
    }
    if (error.status >= 500) {
      return 'Something went wrong. Please try again.';
    }
    return 'Email or password is incorrect. Please try again.';
  }
  if (error instanceof AuthRetryableFetchError || error instanceof TypeError) {
    return 'Unable to connect. Please check your internet connection.';
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('fetch') || message.includes('network') || message.includes('failed to fetch')) {
      return 'Unable to connect. Please check your internet connection.';
    }
  }
  return 'Something went wrong. Please try again.';
}

export function describeDataError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('fetch') || message.includes('network') || message.includes('failed to fetch')) {
      return 'Unable to connect. Please check your internet connection.';
    }
  }
  return 'Something went wrong. Please try again.';
}
