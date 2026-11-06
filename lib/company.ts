import { supabase } from '@/lib/supabase';

export type WorkingDay = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Company = {
  id: string;
  name: string;
  legal_name: string | null;
  description: string | null;
  website: string | null;
  contact_email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  timezone: string;
  currency: string;
  language_preference: 'en' | 'ur';
  default_arrival_time: string;
  default_departure_time: string | null;
  default_grace_minutes: number;
  default_working_days: WorkingDay[];
  default_annual_leave_days: number;
};

export type CompanyForm = {
  name: string;
  legal_name: string;
  description: string;
  website: string;
  contact_email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  timezone: string;
  language_preference: 'en' | 'ur';
  default_arrival_time: string;
  default_departure_time: string;
  default_grace_minutes: string;
  default_working_days: WorkingDay[];
  default_annual_leave_days: string;
};

export type OfficeLocation = {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
};

export type OfficeForm = {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  radius_meters: string;
  is_active: boolean;
};

export type FormErrors<T> = Partial<Record<keyof T, string>>;

const companyColumns = 'id, name, legal_name, description, website, contact_email, phone, address, city, country, timezone, currency, language_preference, default_arrival_time, default_departure_time, default_grace_minutes, default_working_days, default_annual_leave_days';
const officeColumns = 'id, name, address, latitude, longitude, radius_meters, is_active';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function trimTime(value: string | null): string | null {
  return value ? value.slice(0, 5) : null;
}

function normalizeCompany(row: Record<string, unknown>): Company {
  const company = row as unknown as Company;
  return {
    ...company,
    default_arrival_time: trimTime(company.default_arrival_time) ?? '09:00',
    default_departure_time: trimTime(company.default_departure_time),
  };
}

export function companyToForm(company: Company): CompanyForm {
  return {
    name: company.name,
    legal_name: company.legal_name ?? '',
    description: company.description ?? '',
    website: company.website ?? '',
    contact_email: company.contact_email ?? '',
    phone: company.phone ?? '',
    address: company.address ?? '',
    city: company.city ?? '',
    country: company.country ?? '',
    timezone: company.timezone,
    language_preference: company.language_preference,
    default_arrival_time: company.default_arrival_time,
    default_departure_time: company.default_departure_time ?? '',
    default_grace_minutes: String(company.default_grace_minutes),
    default_working_days: company.default_working_days,
    default_annual_leave_days: String(company.default_annual_leave_days),
  };
}

function isValidTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function validateCompanyForm(form: CompanyForm): { errors: FormErrors<CompanyForm>; payload: Omit<Company, 'id' | 'currency'> | null } {
  const errors: FormErrors<CompanyForm> = {};
  const name = form.name.trim();
  const grace = Number(form.default_grace_minutes);
  const leave = Number(form.default_annual_leave_days);
  const contactEmail = form.contact_email.trim();

  if (!name) errors.name = 'Company name is required.';
  if (contactEmail && !EMAIL_PATTERN.test(contactEmail)) errors.contact_email = 'Enter a valid email address.';
  if (!form.timezone.trim() || !isValidTimezone(form.timezone.trim())) errors.timezone = 'Enter a valid timezone, such as Asia/Karachi.';
  if (!TIME_PATTERN.test(form.default_arrival_time)) errors.default_arrival_time = 'Use 24-hour format, such as 09:00.';
  if (form.default_departure_time && !TIME_PATTERN.test(form.default_departure_time)) errors.default_departure_time = 'Use 24-hour format, such as 18:00.';
  if (!Number.isInteger(grace) || grace < 0 || grace > 120) errors.default_grace_minutes = 'Grace period must be between 0 and 120 minutes.';
  if (form.default_working_days.length === 0) errors.default_working_days = 'Select at least one working day.';
  if (!Number.isInteger(leave) || leave < 0 || leave > 365) errors.default_annual_leave_days = 'Annual leave must be between 0 and 365 days.';

  if (Object.keys(errors).length > 0) return { errors, payload: null };

  const optional = (value: string) => value.trim() || null;
  return {
    errors,
    payload: {
      name,
      legal_name: optional(form.legal_name),
      description: optional(form.description),
      website: optional(form.website),
      contact_email: optional(contactEmail),
      phone: optional(form.phone),
      address: optional(form.address),
      city: optional(form.city),
      country: optional(form.country),
      timezone: form.timezone.trim(),
      language_preference: form.language_preference,
      default_arrival_time: form.default_arrival_time,
      default_departure_time: form.default_departure_time || null,
      default_grace_minutes: grace,
      default_working_days: [...form.default_working_days].sort((a, b) => a - b),
      default_annual_leave_days: leave,
    },
  };
}

export async function fetchCompany(companyId: string): Promise<Company> {
  const { data, error } = await supabase.from('companies').select(companyColumns).eq('id', companyId).maybeSingle();
  if (error) throw new Error('Company information could not be loaded. Please try again.');
  if (!data) throw new Error('Company information could not be found.');
  return normalizeCompany(data);
}

export async function saveCompany(companyId: string, payload: Omit<Company, 'id' | 'currency'>): Promise<Company> {
  const { data, error } = await supabase
    .from('companies')
    .update(payload)
    .eq('id', companyId)
    .select(companyColumns)
    .maybeSingle();
  if (error) throw new Error('Company settings could not be saved. Please try again.');
  if (!data) throw new Error('You do not have permission to change company settings.');
  return normalizeCompany(data);
}

export async function fetchPrimaryOffice(companyId: string): Promise<OfficeLocation | null> {
  const { data, error } = await supabase
    .from('office_locations')
    .select(officeColumns)
    .eq('company_id', companyId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error('Office details could not be loaded. Please try again.');
  return data as OfficeLocation | null;
}

export function officeToForm(office: OfficeLocation | null): OfficeForm {
  return {
    name: office?.name ?? '',
    address: office?.address ?? '',
    latitude: office ? String(office.latitude) : '',
    longitude: office ? String(office.longitude) : '',
    radius_meters: office ? String(office.radius_meters) : '100',
    is_active: office?.is_active ?? true,
  };
}

export function validateOfficeForm(form: OfficeForm): { errors: FormErrors<OfficeForm>; payload: Omit<OfficeLocation, 'id'> | null } {
  const errors: FormErrors<OfficeForm> = {};
  const latitude = Number(form.latitude);
  const longitude = Number(form.longitude);
  const radius = Number(form.radius_meters);
  const name = form.name.trim();

  if (!name) errors.name = 'Office name is required.';
  if (form.latitude.trim() === '' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) errors.latitude = 'Latitude must be between -90 and 90.';
  if (form.longitude.trim() === '' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) errors.longitude = 'Longitude must be between -180 and 180.';
  if (!Number.isInteger(radius) || radius < 10 || radius > 5000) errors.radius_meters = 'Geofence radius must be between 10 and 5000 metres.';

  if (Object.keys(errors).length > 0) return { errors, payload: null };
  return {
    errors,
    payload: {
      name,
      address: form.address.trim() || null,
      latitude,
      longitude,
      radius_meters: radius,
      is_active: form.is_active,
    },
  };
}

export async function savePrimaryOffice(companyId: string, existingId: string | null, payload: Omit<OfficeLocation, 'id'>): Promise<OfficeLocation> {
  const query = existingId
    ? supabase.from('office_locations').update(payload).eq('id', existingId)
    : supabase.from('office_locations').insert({ ...payload, company_id: companyId });
  const { data, error } = await query.select(officeColumns).maybeSingle();
  if (error) throw new Error('Office details could not be saved. Please try again.');
  if (!data) throw new Error('You do not have permission to change office details.');
  return data as OfficeLocation;
}
