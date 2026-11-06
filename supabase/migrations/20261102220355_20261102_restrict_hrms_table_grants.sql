/*
# Restrict HRMS table grants

1. Purpose
- Removes default broad Data API privileges from anonymous and authenticated roles.
- Re-grants only the operations required by the existing HRMS RLS policies.

2. Security
- Anonymous clients receive no access to HRMS tables.
- Authenticated users receive only the minimum table and column privileges needed by the current foundation.
- Row Level Security remains the primary row-level authorization layer.
*/

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT ON public.companies TO authenticated;
GRANT SELECT, UPDATE (display_name, avatar_path, preferred_language, theme_preference) ON public.profiles TO authenticated;
GRANT SELECT ON public.employees TO authenticated;
GRANT SELECT ON public.leave_balances, public.attendance_records, public.attendance_events, public.salary_structures, public.payroll_calculations, public.payslips, public.audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.office_locations, public.working_schedules, public.public_holidays, public.leave_types TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks, public.task_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.leave_applications TO authenticated;
GRANT SELECT ON public.payroll_periods TO authenticated;

REVOKE INSERT, UPDATE ON public.leave_applications FROM authenticated;
GRANT INSERT (employee_id, leave_type_id, start_date, end_date, requested_days, reason) ON public.leave_applications TO authenticated;
GRANT UPDATE (status, rejection_comment, reviewed_by, reviewed_at) ON public.leave_applications TO authenticated;

REVOKE INSERT, UPDATE ON public.tasks FROM authenticated;
GRANT INSERT (company_id, title, description, priority, due_date) ON public.tasks TO authenticated;
GRANT UPDATE (title, description, priority, due_date) ON public.tasks TO authenticated;

REVOKE INSERT, UPDATE ON public.task_assignments FROM authenticated;
GRANT INSERT (task_id, employee_id, assignment_reason) ON public.task_assignments TO authenticated;
GRANT UPDATE (status, completed_at) ON public.task_assignments TO authenticated;

REVOKE INSERT, UPDATE ON public.business_rules FROM authenticated;
GRANT INSERT (company_id, rule_key, rule_value, version, is_active, effective_from) ON public.business_rules TO authenticated;
GRANT UPDATE (rule_value, version, is_active, effective_from) ON public.business_rules TO authenticated;
