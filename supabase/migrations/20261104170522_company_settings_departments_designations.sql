/*
# Company settings, departments and designations

## 1. Plain-English summary
- Company records gain the settings Admins edit in Company Settings (description, website, city, country, language and default working rules).
- Two new company-scoped tables hold departments and designations (job titles linked to a department).
- Employees gain optional links to a department and a designation. Existing text department and job title columns are kept untouched.
- Office locations gain an address and a default geofence radius of 100 metres.
- Admins can edit company settings. Every company member can read them. Only Admins can change departments and designations.
- Every change to companies, departments and designations is written to the audit log.
- Starter departments and designations are seeded for the existing company.

## 2. New tables
- departments: id, company_id, name, description, head_employee_id (optional employee record), is_active, timestamps. Unique name per company (case-insensitive).
- designations: id, company_id, department_id, name, job_description, reporting_level (1 = most senior, 10 = least), employment_category, is_active, timestamps. Unique name per company (case-insensitive).

## 3. Modified tables
- companies: adds description, website, city, country, currency (fixed to PKR), language_preference (en or ur), default_arrival_time (09:00), default_departure_time (empty until set), default_grace_minutes (15), default_working_days (Mon to Fri), default_annual_leave_days (24).
- office_locations: adds address; radius default set to 100 metres.
- employees: adds optional department_id and designation_id links.

## 4. Security
- RLS enabled on departments and designations.
- Read access: Admin, HR and Employee of the same company.
- Write access: Admin of the same company only. Designations must reference a department from the same company.
- No DELETE grant on departments or designations: records are deactivated instead.
- Company updates: Admin of that company only, limited to the editable columns (currency, ids and timestamps are not writable).
- Audit trigger function is not callable by app roles.

## 5. Important notes
1. Departments and designations use is_active for safe deactivation.
2. Seed data is inserted once for the earliest company and can be deactivated later.
3. Default working days and departure time are starting values for the company to confirm.
*/

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'PKR',
  ADD COLUMN IF NOT EXISTS language_preference text NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS default_arrival_time time NOT NULL DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS default_departure_time time,
  ADD COLUMN IF NOT EXISTS default_grace_minutes integer NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS default_working_days smallint[] NOT NULL DEFAULT '{1,2,3,4,5}',
  ADD COLUMN IF NOT EXISTS default_annual_leave_days integer NOT NULL DEFAULT 24;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_currency_pkr') THEN
    ALTER TABLE companies ADD CONSTRAINT companies_currency_pkr CHECK (currency = 'PKR');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_language_check') THEN
    ALTER TABLE companies ADD CONSTRAINT companies_language_check CHECK (language_preference IN ('en', 'ur'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_grace_range') THEN
    ALTER TABLE companies ADD CONSTRAINT companies_grace_range CHECK (default_grace_minutes BETWEEN 0 AND 120);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_leave_range') THEN
    ALTER TABLE companies ADD CONSTRAINT companies_leave_range CHECK (default_annual_leave_days BETWEEN 0 AND 365);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_working_days_valid') THEN
    ALTER TABLE companies ADD CONSTRAINT companies_working_days_valid CHECK (default_working_days <@ ARRAY[1,2,3,4,5,6,7]::smallint[]);
  END IF;
END $$;

ALTER TABLE office_locations ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE office_locations ALTER COLUMN radius_meters SET DEFAULT 100;

CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 100),
  description text,
  head_employee_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS departments_company_name_key ON departments (company_id, lower(name));
CREATE INDEX IF NOT EXISTS departments_head_employee_idx ON departments (head_employee_id);

CREATE TABLE IF NOT EXISTS designations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 100),
  job_description text,
  reporting_level integer NOT NULL DEFAULT 3 CHECK (reporting_level BETWEEN 1 AND 10),
  employment_category text NOT NULL DEFAULT 'full_time' CHECK (employment_category IN ('full_time', 'part_time', 'contract', 'intern')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS designations_company_name_key ON designations (company_id, lower(name));
CREATE INDEX IF NOT EXISTS designations_department_idx ON designations (department_id);

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS designation_id uuid REFERENCES designations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS employees_department_idx ON employees (department_id);
CREATE INDEX IF NOT EXISTS employees_designation_idx ON employees (designation_id);

CREATE OR REPLACE FUNCTION public.set_row_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_company_configuration_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row_company_id uuid;
BEGIN
  row_company_id := CASE WHEN TG_TABLE_NAME = 'companies' THEN NEW.id ELSE NEW.company_id END;
  INSERT INTO audit_logs (company_id, actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    row_company_id,
    auth.uid(),
    lower(TG_OP) || '_' || TG_TABLE_NAME,
    TG_TABLE_NAME,
    NEW.id,
    jsonb_build_object('before', CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END, 'after', to_jsonb(NEW))
  );
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.audit_company_configuration_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS companies_set_updated_at ON companies;
CREATE TRIGGER companies_set_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION public.set_row_updated_at();
DROP TRIGGER IF EXISTS companies_audit ON companies;
CREATE TRIGGER companies_audit AFTER UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION public.audit_company_configuration_change();

DROP TRIGGER IF EXISTS departments_set_updated_at ON departments;
CREATE TRIGGER departments_set_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION public.set_row_updated_at();
DROP TRIGGER IF EXISTS departments_audit ON departments;
CREATE TRIGGER departments_audit AFTER INSERT OR UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION public.audit_company_configuration_change();

DROP TRIGGER IF EXISTS designations_set_updated_at ON designations;
CREATE TRIGGER designations_set_updated_at BEFORE UPDATE ON designations FOR EACH ROW EXECUTE FUNCTION public.set_row_updated_at();
DROP TRIGGER IF EXISTS designations_audit ON designations;
CREATE TRIGGER designations_audit AFTER INSERT OR UPDATE ON designations FOR EACH ROW EXECUTE FUNCTION public.audit_company_configuration_change();

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE designations ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON departments TO authenticated;
GRANT INSERT (company_id, name, description, head_employee_id, is_active) ON departments TO authenticated;
GRANT UPDATE (name, description, head_employee_id, is_active) ON departments TO authenticated;

GRANT SELECT ON designations TO authenticated;
GRANT INSERT (company_id, department_id, name, job_description, reporting_level, employment_category, is_active) ON designations TO authenticated;
GRANT UPDATE (department_id, name, job_description, reporting_level, employment_category, is_active) ON designations TO authenticated;

GRANT UPDATE (name, legal_name, description, website, phone, contact_email, address, city, country, timezone, language_preference, default_arrival_time, default_departure_time, default_grace_minutes, default_working_days, default_annual_leave_days) ON companies TO authenticated;

DROP POLICY IF EXISTS "members_read_departments" ON departments;
CREATE POLICY "members_read_departments" ON departments FOR SELECT
  TO authenticated USING (has_company_role(company_id, ARRAY['admin', 'hr', 'employee']));

DROP POLICY IF EXISTS "admins_insert_departments" ON departments;
CREATE POLICY "admins_insert_departments" ON departments FOR INSERT
  TO authenticated WITH CHECK (has_company_role(company_id, ARRAY['admin']));

DROP POLICY IF EXISTS "admins_update_departments" ON departments;
CREATE POLICY "admins_update_departments" ON departments FOR UPDATE
  TO authenticated USING (has_company_role(company_id, ARRAY['admin'])) WITH CHECK (has_company_role(company_id, ARRAY['admin']));

DROP POLICY IF EXISTS "members_read_designations" ON designations;
CREATE POLICY "members_read_designations" ON designations FOR SELECT
  TO authenticated USING (has_company_role(company_id, ARRAY['admin', 'hr', 'employee']));

DROP POLICY IF EXISTS "admins_insert_designations" ON designations;
CREATE POLICY "admins_insert_designations" ON designations FOR INSERT
  TO authenticated WITH CHECK (
    has_company_role(company_id, ARRAY['admin'])
    AND EXISTS (SELECT 1 FROM departments d WHERE d.id = department_id AND d.company_id = designations.company_id)
  );

DROP POLICY IF EXISTS "admins_update_designations" ON designations;
CREATE POLICY "admins_update_designations" ON designations FOR UPDATE
  TO authenticated USING (has_company_role(company_id, ARRAY['admin']))
  WITH CHECK (
    has_company_role(company_id, ARRAY['admin'])
    AND EXISTS (SELECT 1 FROM departments d WHERE d.id = department_id AND d.company_id = designations.company_id)
  );

DROP POLICY IF EXISTS "admins_update_company" ON companies;
CREATE POLICY "admins_update_company" ON companies FOR UPDATE
  TO authenticated USING (has_company_role(id, ARRAY['admin'])) WITH CHECK (has_company_role(id, ARRAY['admin']));

INSERT INTO departments (company_id, name, description)
SELECT c.id, v.name, v.description
FROM (SELECT id FROM companies ORDER BY created_at LIMIT 1) c
CROSS JOIN (VALUES
  ('Information Technology', 'Software, infrastructure and internal systems.'),
  ('Human Resources', 'Recruitment, employee relations and HR operations.'),
  ('Finance', 'Accounting, payroll and financial reporting.'),
  ('Marketing', 'Brand, campaigns and customer communication.'),
  ('Operations', 'Day-to-day business and facility operations.'),
  ('Administration', 'Office administration and general support.')
) AS v(name, description)
ON CONFLICT DO NOTHING;

INSERT INTO designations (company_id, department_id, name, reporting_level, employment_category)
SELECT d.company_id, d.id, v.name, v.level, 'full_time'
FROM (VALUES
  ('Senior Software Developer', 'Information Technology', 2),
  ('Software Developer', 'Information Technology', 3),
  ('HR Manager', 'Human Resources', 2),
  ('HR Executive', 'Human Resources', 3),
  ('Accountant', 'Finance', 3),
  ('Marketing Executive', 'Marketing', 3),
  ('Operations Manager', 'Operations', 2),
  ('Office Assistant', 'Administration', 4)
) AS v(name, dept_name, level)
JOIN departments d ON d.name = v.dept_name
ON CONFLICT DO NOTHING;
