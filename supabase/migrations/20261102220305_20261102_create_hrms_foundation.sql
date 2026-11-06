/*
# Create Smart Attendance & HRMS foundation

1. Purpose
- Creates the initial multi-company data model for the Smart Attendance & HR Management System.
- Supports authenticated Employee, HR, and Admin users.
- Keeps attendance, leave, payroll, and company rules in durable database tables.

2. New tables
- `companies`: company identity and timezone.
- `profiles`: authenticated identity, role, and approval state.
- `employees`: HR details linked to a profile.
- `office_locations`: office coordinates and geofence radius.
- `working_schedules`: work hours, grace period, and workdays.
- `public_holidays`: company holidays.
- `business_rules`: versioned configurable rules.
- `leave_types`, `leave_balances`, `leave_applications`: leave configuration, balances, and approvals.
- `attendance_records`, `attendance_events`: daily summaries and verification attempts.
- `tasks`, `task_assignments`: work allocation and reassignment.
- `salary_structures`: restricted salary information.
- `payroll_periods`, `payroll_calculations`, `payslips`: payroll lifecycle and employee documents.
- `audit_logs`: security and business-action audit trail.

3. Important unresolved requirement
- Official salary formulas were not supplied. Payroll calculation inputs and outputs are stored as structured JSON until the official formulas are confirmed. No salary formula is invented here.

4. Security
- RLS is enabled on every new table.
- Client access is limited to authenticated users and company membership.
- Employees can access only their own private records.
- HR and Admin access is limited to their company.
- Salary, balances, attendance writes, payroll writes, and audit writes are not client-writable.
- Protected role checks use a SECURITY DEFINER helper with a fixed search path.
*/

CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, legal_name text, timezone text NOT NULL DEFAULT 'UTC', contact_email text, phone text, address text, logo_path text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL, email text NOT NULL, display_name text, avatar_path text, role text NOT NULL DEFAULT 'employee' CHECK (role IN ('admin','hr','employee')), account_status text NOT NULL DEFAULT 'pending' CHECK (account_status IN ('pending','active','rejected','suspended','deactivated')), preferred_language text NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en','ur')), theme_preference text NOT NULL DEFAULT 'system' CHECK (theme_preference IN ('light','dark','system')), approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL, approved_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), profile_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE, company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, employee_number text NOT NULL, first_name text NOT NULL, last_name text NOT NULL, phone text, department text, job_title text, manager_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL, joining_date date, employment_status text NOT NULL DEFAULT 'active' CHECK (employment_status IN ('active','on_leave','inactive','terminated')), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE (company_id, employee_number)
);
CREATE TABLE IF NOT EXISTS public.office_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, name text NOT NULL, latitude numeric(10,7) NOT NULL CHECK (latitude BETWEEN -90 AND 90), longitude numeric(10,7) NOT NULL CHECK (longitude BETWEEN -180 AND 180), radius_meters integer NOT NULL DEFAULT 100 CHECK (radius_meters BETWEEN 10 AND 5000), is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.working_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, name text NOT NULL, arrival_time time NOT NULL DEFAULT '09:00:00', grace_period_minutes integer NOT NULL DEFAULT 15 CHECK (grace_period_minutes BETWEEN 0 AND 240), departure_time time, working_days smallint[] NOT NULL DEFAULT ARRAY[1,2,3,4,5], is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.public_holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, holiday_date date NOT NULL, name text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (company_id, holiday_date)
);
CREATE TABLE IF NOT EXISTS public.business_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, rule_key text NOT NULL, rule_value jsonb NOT NULL, version integer NOT NULL DEFAULT 1 CHECK (version > 0), is_active boolean NOT NULL DEFAULT true, effective_from date NOT NULL DEFAULT current_date, created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (company_id, rule_key, version)
);
CREATE TABLE IF NOT EXISTS public.leave_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, name text NOT NULL, code text NOT NULL, is_paid boolean NOT NULL DEFAULT true, annual_allocation numeric(6,2) NOT NULL DEFAULT 0 CHECK (annual_allocation >= 0), requires_approval boolean NOT NULL DEFAULT true, is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (company_id, code)
);
CREATE TABLE IF NOT EXISTS public.leave_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE, leave_type_id uuid NOT NULL REFERENCES public.leave_types(id) ON DELETE RESTRICT, leave_year integer NOT NULL CHECK (leave_year BETWEEN 2000 AND 2200), allocated numeric(6,2) NOT NULL DEFAULT 0 CHECK (allocated >= 0), used numeric(6,2) NOT NULL DEFAULT 0 CHECK (used >= 0), pending numeric(6,2) NOT NULL DEFAULT 0 CHECK (pending >= 0), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE (employee_id, leave_type_id, leave_year)
);
CREATE TABLE IF NOT EXISTS public.leave_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE, leave_type_id uuid NOT NULL REFERENCES public.leave_types(id) ON DELETE RESTRICT, start_date date NOT NULL, end_date date NOT NULL, requested_days numeric(6,2) NOT NULL CHECK (requested_days > 0), reason text, status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')), submitted_by uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE RESTRICT, reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL, reviewed_at timestamptz, rejection_comment text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CHECK (end_date >= start_date), CHECK (status <> 'rejected' OR nullif(trim(rejection_comment),'') IS NOT NULL)
);
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE, attendance_date date NOT NULL, check_in_at timestamptz, check_out_at timestamptz, status text NOT NULL DEFAULT 'absent' CHECK (status IN ('present','late','absent','leave','holiday','weekend','exception')), late_minutes integer NOT NULL DEFAULT 0 CHECK (late_minutes >= 0), notes text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE (employee_id, attendance_date)
);
CREATE TABLE IF NOT EXISTS public.attendance_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), attendance_record_id uuid REFERENCES public.attendance_records(id) ON DELETE SET NULL, employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE, event_type text NOT NULL CHECK (event_type IN ('check_in_attempt','check_out_attempt','manual_correction')), occurred_at timestamptz NOT NULL DEFAULT now(), latitude numeric(10,7), longitude numeric(10,7), location_accuracy_meters numeric(8,2), geofence_passed boolean, face_verification_passed boolean, verification_reference text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, title text NOT NULL, description text, priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')), due_date date, created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE RESTRICT, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.task_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE, employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE, assignment_reason text, status text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned','in_progress','completed','cancelled')), assigned_by uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE RESTRICT, completed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE (task_id, employee_id)
);
CREATE TABLE IF NOT EXISTS public.salary_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), employee_id uuid NOT NULL UNIQUE REFERENCES public.employees(id) ON DELETE CASCADE, currency text NOT NULL DEFAULT 'PKR', base_salary numeric(14,2) NOT NULL CHECK (base_salary >= 0), allowances jsonb NOT NULL DEFAULT '{}'::jsonb, effective_from date NOT NULL, effective_to date, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CHECK (effective_to IS NULL OR effective_to >= effective_from)
);
CREATE TABLE IF NOT EXISTS public.payroll_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE, period_start date NOT NULL, period_end date NOT NULL, status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','calculating','under_review','approved','locked')), approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL, approved_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE (company_id, period_start, period_end), CHECK (period_end >= period_start)
);
CREATE TABLE IF NOT EXISTS public.payroll_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), payroll_period_id uuid NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE, employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE, rule_version text NOT NULL, inputs jsonb NOT NULL DEFAULT '{}'::jsonb, outputs jsonb NOT NULL DEFAULT '{}'::jsonb, calculation_status text NOT NULL DEFAULT 'calculated' CHECK (calculation_status IN ('calculated','reviewed','approved','adjustment_required')), calculated_at timestamptz NOT NULL DEFAULT now(), UNIQUE (payroll_period_id, employee_id)
);
CREATE TABLE IF NOT EXISTS public.payslips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), payroll_period_id uuid NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE, employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE, storage_path text NOT NULL, issued_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (payroll_period_id, employee_id)
);
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE, actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL, action text NOT NULL, entity_type text NOT NULL, entity_id uuid, metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.has_company_role(p_company_id uuid, p_roles text[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles AS caller_profile WHERE caller_profile.id = auth.uid() AND caller_profile.company_id = p_company_id AND caller_profile.account_status = 'active' AND caller_profile.role = ANY(p_roles));
$$;
REVOKE EXECUTE ON FUNCTION public.has_company_role(uuid,text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_company_role(uuid,text[]) TO authenticated;

CREATE INDEX IF NOT EXISTS employees_company_id_idx ON public.employees(company_id);
CREATE INDEX IF NOT EXISTS employees_profile_id_idx ON public.employees(profile_id);
CREATE INDEX IF NOT EXISTS leave_applications_employee_id_idx ON public.leave_applications(employee_id);
CREATE INDEX IF NOT EXISTS leave_applications_status_idx ON public.leave_applications(status);
CREATE INDEX IF NOT EXISTS attendance_records_employee_date_idx ON public.attendance_records(employee_id, attendance_date DESC);
CREATE INDEX IF NOT EXISTS attendance_events_employee_time_idx ON public.attendance_events(employee_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS tasks_company_id_idx ON public.tasks(company_id);
CREATE INDEX IF NOT EXISTS task_assignments_employee_id_idx ON public.task_assignments(employee_id);
CREATE INDEX IF NOT EXISTS payroll_periods_company_date_idx ON public.payroll_periods(company_id, period_start DESC);
CREATE INDEX IF NOT EXISTS audit_logs_company_created_idx ON public.audit_logs(company_id, created_at DESC);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.working_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.companies TO authenticated;
GRANT SELECT, UPDATE (display_name,avatar_path,preferred_language,theme_preference) ON public.profiles TO authenticated;
GRANT SELECT ON public.employees, public.leave_balances, public.attendance_records, public.attendance_events, public.salary_structures, public.payroll_calculations, public.payslips, public.audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.office_locations, public.working_schedules, public.public_holidays, public.business_rules, public.leave_types TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks, public.task_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.leave_applications TO authenticated;
GRANT SELECT ON public.payroll_periods TO authenticated;

DROP POLICY IF EXISTS "company_members_read_companies" ON public.companies;
CREATE POLICY "company_members_read_companies" ON public.companies FOR SELECT TO authenticated USING (companies.id = (SELECT p.company_id FROM public.profiles AS p WHERE p.id = auth.uid()));

DROP POLICY IF EXISTS "users_read_visible_profiles" ON public.profiles;
CREATE POLICY "users_read_visible_profiles" ON public.profiles FOR SELECT TO authenticated USING (profiles.id = auth.uid() OR (profiles.company_id = (SELECT p.company_id FROM public.profiles AS p WHERE p.id = auth.uid()) AND public.has_company_role(profiles.company_id, ARRAY['admin','hr'])));
DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
CREATE POLICY "users_update_own_profile" ON public.profiles FOR UPDATE TO authenticated USING (profiles.id = auth.uid()) WITH CHECK (profiles.id = auth.uid());

DROP POLICY IF EXISTS "members_read_company_employees" ON public.employees;
CREATE POLICY "members_read_company_employees" ON public.employees FOR SELECT TO authenticated USING (employees.profile_id = auth.uid() OR public.has_company_role(employees.company_id, ARRAY['admin','hr']));

DROP POLICY IF EXISTS "members_read_office_locations" ON public.office_locations;
CREATE POLICY "members_read_office_locations" ON public.office_locations FOR SELECT TO authenticated USING (public.has_company_role(office_locations.company_id, ARRAY['admin','hr','employee']));
DROP POLICY IF EXISTS "admins_insert_office_locations" ON public.office_locations;
CREATE POLICY "admins_insert_office_locations" ON public.office_locations FOR INSERT TO authenticated WITH CHECK (public.has_company_role(office_locations.company_id, ARRAY['admin']));
DROP POLICY IF EXISTS "admins_update_office_locations" ON public.office_locations;
CREATE POLICY "admins_update_office_locations" ON public.office_locations FOR UPDATE TO authenticated USING (public.has_company_role(office_locations.company_id, ARRAY['admin'])) WITH CHECK (public.has_company_role(office_locations.company_id, ARRAY['admin']));
DROP POLICY IF EXISTS "admins_delete_office_locations" ON public.office_locations;
CREATE POLICY "admins_delete_office_locations" ON public.office_locations FOR DELETE TO authenticated USING (public.has_company_role(office_locations.company_id, ARRAY['admin']));

DROP POLICY IF EXISTS "members_read_working_schedules" ON public.working_schedules;
CREATE POLICY "members_read_working_schedules" ON public.working_schedules FOR SELECT TO authenticated USING (public.has_company_role(working_schedules.company_id, ARRAY['admin','hr','employee']));
DROP POLICY IF EXISTS "admins_insert_working_schedules" ON public.working_schedules;
CREATE POLICY "admins_insert_working_schedules" ON public.working_schedules FOR INSERT TO authenticated WITH CHECK (public.has_company_role(working_schedules.company_id, ARRAY['admin']));
DROP POLICY IF EXISTS "admins_update_working_schedules" ON public.working_schedules;
CREATE POLICY "admins_update_working_schedules" ON public.working_schedules FOR UPDATE TO authenticated USING (public.has_company_role(working_schedules.company_id, ARRAY['admin'])) WITH CHECK (public.has_company_role(working_schedules.company_id, ARRAY['admin']));
DROP POLICY IF EXISTS "admins_delete_working_schedules" ON public.working_schedules;
CREATE POLICY "admins_delete_working_schedules" ON public.working_schedules FOR DELETE TO authenticated USING (public.has_company_role(working_schedules.company_id, ARRAY['admin']));

DROP POLICY IF EXISTS "members_read_public_holidays" ON public.public_holidays;
CREATE POLICY "members_read_public_holidays" ON public.public_holidays FOR SELECT TO authenticated USING (public.has_company_role(public_holidays.company_id, ARRAY['admin','hr','employee']));
DROP POLICY IF EXISTS "admins_insert_public_holidays" ON public.public_holidays;
CREATE POLICY "admins_insert_public_holidays" ON public.public_holidays FOR INSERT TO authenticated WITH CHECK (public.has_company_role(public_holidays.company_id, ARRAY['admin']));
DROP POLICY IF EXISTS "admins_update_public_holidays" ON public.public_holidays;
CREATE POLICY "admins_update_public_holidays" ON public.public_holidays FOR UPDATE TO authenticated USING (public.has_company_role(public_holidays.company_id, ARRAY['admin'])) WITH CHECK (public.has_company_role(public_holidays.company_id, ARRAY['admin']));
DROP POLICY IF EXISTS "admins_delete_public_holidays" ON public.public_holidays;
CREATE POLICY "admins_delete_public_holidays" ON public.public_holidays FOR DELETE TO authenticated USING (public.has_company_role(public_holidays.company_id, ARRAY['admin']));

DROP POLICY IF EXISTS "members_read_business_rules" ON public.business_rules;
CREATE POLICY "members_read_business_rules" ON public.business_rules FOR SELECT TO authenticated USING (public.has_company_role(business_rules.company_id, ARRAY['admin','hr','employee']));
DROP POLICY IF EXISTS "admins_insert_business_rules" ON public.business_rules;
CREATE POLICY "admins_insert_business_rules" ON public.business_rules FOR INSERT TO authenticated WITH CHECK (public.has_company_role(business_rules.company_id, ARRAY['admin']));
DROP POLICY IF EXISTS "admins_update_business_rules" ON public.business_rules;
CREATE POLICY "admins_update_business_rules" ON public.business_rules FOR UPDATE TO authenticated USING (public.has_company_role(business_rules.company_id, ARRAY['admin'])) WITH CHECK (public.has_company_role(business_rules.company_id, ARRAY['admin']));
DROP POLICY IF EXISTS "admins_delete_business_rules" ON public.business_rules;
CREATE POLICY "admins_delete_business_rules" ON public.business_rules FOR DELETE TO authenticated USING (public.has_company_role(business_rules.company_id, ARRAY['admin']));

DROP POLICY IF EXISTS "members_read_leave_types" ON public.leave_types;
CREATE POLICY "members_read_leave_types" ON public.leave_types FOR SELECT TO authenticated USING (public.has_company_role(leave_types.company_id, ARRAY['admin','hr','employee']));
DROP POLICY IF EXISTS "admins_insert_leave_types" ON public.leave_types;
CREATE POLICY "admins_insert_leave_types" ON public.leave_types FOR INSERT TO authenticated WITH CHECK (public.has_company_role(leave_types.company_id, ARRAY['admin']));
DROP POLICY IF EXISTS "admins_update_leave_types" ON public.leave_types;
CREATE POLICY "admins_update_leave_types" ON public.leave_types FOR UPDATE TO authenticated USING (public.has_company_role(leave_types.company_id, ARRAY['admin'])) WITH CHECK (public.has_company_role(leave_types.company_id, ARRAY['admin']));
DROP POLICY IF EXISTS "admins_delete_leave_types" ON public.leave_types;
CREATE POLICY "admins_delete_leave_types" ON public.leave_types FOR DELETE TO authenticated USING (public.has_company_role(leave_types.company_id, ARRAY['admin']));

DROP POLICY IF EXISTS "users_read_leave_balances" ON public.leave_balances;
CREATE POLICY "users_read_leave_balances" ON public.leave_balances FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.employees AS e WHERE e.id = leave_balances.employee_id AND (e.profile_id = auth.uid() OR public.has_company_role(e.company_id, ARRAY['admin','hr']))));

DROP POLICY IF EXISTS "users_read_leave_applications" ON public.leave_applications;
CREATE POLICY "users_read_leave_applications" ON public.leave_applications FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.employees AS e WHERE e.id = leave_applications.employee_id AND (e.profile_id = auth.uid() OR public.has_company_role(e.company_id, ARRAY['admin','hr']))));
DROP POLICY IF EXISTS "employees_insert_own_leave_applications" ON public.leave_applications;
CREATE POLICY "employees_insert_own_leave_applications" ON public.leave_applications FOR INSERT TO authenticated WITH CHECK (leave_applications.submitted_by = auth.uid() AND EXISTS (SELECT 1 FROM public.employees AS e WHERE e.id = leave_applications.employee_id AND e.profile_id = auth.uid()));
DROP POLICY IF EXISTS "hr_update_leave_applications" ON public.leave_applications;
CREATE POLICY "hr_update_leave_applications" ON public.leave_applications FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.employees AS e WHERE e.id = leave_applications.employee_id AND public.has_company_role(e.company_id, ARRAY['admin','hr']))) WITH CHECK (EXISTS (SELECT 1 FROM public.employees AS e WHERE e.id = leave_applications.employee_id AND public.has_company_role(e.company_id, ARRAY['admin','hr'])));

DROP POLICY IF EXISTS "users_read_attendance_records" ON public.attendance_records;
CREATE POLICY "users_read_attendance_records" ON public.attendance_records FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.employees AS e WHERE e.id = attendance_records.employee_id AND (e.profile_id = auth.uid() OR public.has_company_role(e.company_id, ARRAY['admin','hr']))));
DROP POLICY IF EXISTS "users_read_attendance_events" ON public.attendance_events;
CREATE POLICY "users_read_attendance_events" ON public.attendance_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.employees AS e WHERE e.id = attendance_events.employee_id AND (e.profile_id = auth.uid() OR public.has_company_role(e.company_id, ARRAY['admin','hr']))));

DROP POLICY IF EXISTS "members_read_tasks" ON public.tasks;
CREATE POLICY "members_read_tasks" ON public.tasks FOR SELECT TO authenticated USING (public.has_company_role(tasks.company_id, ARRAY['admin','hr']) OR EXISTS (SELECT 1 FROM public.task_assignments AS ta JOIN public.employees AS e ON e.id = ta.employee_id WHERE ta.task_id = tasks.id AND e.profile_id = auth.uid()));
DROP POLICY IF EXISTS "staff_insert_tasks" ON public.tasks;
CREATE POLICY "staff_insert_tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (tasks.created_by = auth.uid() AND public.has_company_role(tasks.company_id, ARRAY['admin','hr']));
DROP POLICY IF EXISTS "staff_update_tasks" ON public.tasks;
CREATE POLICY "staff_update_tasks" ON public.tasks FOR UPDATE TO authenticated USING (public.has_company_role(tasks.company_id, ARRAY['admin','hr'])) WITH CHECK (public.has_company_role(tasks.company_id, ARRAY['admin','hr']));
DROP POLICY IF EXISTS "staff_delete_tasks" ON public.tasks;
CREATE POLICY "staff_delete_tasks" ON public.tasks FOR DELETE TO authenticated USING (public.has_company_role(tasks.company_id, ARRAY['admin','hr']));

DROP POLICY IF EXISTS "members_read_task_assignments" ON public.task_assignments;
CREATE POLICY "members_read_task_assignments" ON public.task_assignments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.employees AS e JOIN public.tasks AS t ON t.id = task_assignments.task_id WHERE e.id = task_assignments.employee_id AND (e.profile_id = auth.uid() OR public.has_company_role(t.company_id, ARRAY['admin','hr']))));
DROP POLICY IF EXISTS "staff_insert_task_assignments" ON public.task_assignments;
CREATE POLICY "staff_insert_task_assignments" ON public.task_assignments FOR INSERT TO authenticated WITH CHECK (task_assignments.assigned_by = auth.uid() AND EXISTS (SELECT 1 FROM public.tasks AS t WHERE t.id = task_assignments.task_id AND public.has_company_role(t.company_id, ARRAY['admin','hr'])));
DROP POLICY IF EXISTS "users_update_task_assignments" ON public.task_assignments;
CREATE POLICY "users_update_task_assignments" ON public.task_assignments FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.employees AS e JOIN public.tasks AS t ON t.id = task_assignments.task_id WHERE e.id = task_assignments.employee_id AND (e.profile_id = auth.uid() OR public.has_company_role(t.company_id, ARRAY['admin','hr'])))) WITH CHECK (EXISTS (SELECT 1 FROM public.employees AS e JOIN public.tasks AS t ON t.id = task_assignments.task_id WHERE e.id = task_assignments.employee_id AND (e.profile_id = auth.uid() OR public.has_company_role(t.company_id, ARRAY['admin','hr']))));
DROP POLICY IF EXISTS "staff_delete_task_assignments" ON public.task_assignments;
CREATE POLICY "staff_delete_task_assignments" ON public.task_assignments FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.tasks AS t WHERE t.id = task_assignments.task_id AND public.has_company_role(t.company_id, ARRAY['admin','hr'])));

DROP POLICY IF EXISTS "users_read_salary_structures" ON public.salary_structures;
CREATE POLICY "users_read_salary_structures" ON public.salary_structures FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.employees AS e WHERE e.id = salary_structures.employee_id AND (e.profile_id = auth.uid() OR public.has_company_role(e.company_id, ARRAY['admin','hr']))));
DROP POLICY IF EXISTS "staff_read_payroll_periods" ON public.payroll_periods;
CREATE POLICY "staff_read_payroll_periods" ON public.payroll_periods FOR SELECT TO authenticated USING (public.has_company_role(payroll_periods.company_id, ARRAY['admin','hr']));
DROP POLICY IF EXISTS "staff_read_payroll_calculations" ON public.payroll_calculations;
CREATE POLICY "staff_read_payroll_calculations" ON public.payroll_calculations FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.payroll_periods AS p WHERE p.id = payroll_calculations.payroll_period_id AND public.has_company_role(p.company_id, ARRAY['admin','hr'])));
DROP POLICY IF EXISTS "users_read_own_payslips" ON public.payslips;
CREATE POLICY "users_read_own_payslips" ON public.payslips FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.employees AS e WHERE e.id = payslips.employee_id AND (e.profile_id = auth.uid() OR public.has_company_role(e.company_id, ARRAY['admin','hr']))));
DROP POLICY IF EXISTS "admins_read_audit_logs" ON public.audit_logs;
CREATE POLICY "admins_read_audit_logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_company_role(audit_logs.company_id, ARRAY['admin']));
