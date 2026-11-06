/*
# Harden HRMS client write permissions

1. Purpose
- Prevents mobile clients from writing protected workflow, ownership, approval, and audit columns directly.

2. Changes
- Leave requests can be created only with employee-provided request fields; status and review fields are staff-controlled.
- Task creation and editing exclude creator and audit ownership fields.
- Task assignment creation and editing exclude assignment ownership fields.
- Business-rule authorship defaults to the authenticated caller.

3. Security
- Replaces broad table-level write grants with column-restricted grants.
- Existing RLS policies remain in force.
*/

ALTER TABLE public.business_rules ALTER COLUMN created_by SET DEFAULT auth.uid();

REVOKE INSERT, UPDATE ON public.leave_applications FROM authenticated;
GRANT INSERT (employee_id, leave_type_id, start_date, end_date, requested_days, reason) ON public.leave_applications TO authenticated;
GRANT UPDATE (status, rejection_comment, reviewed_by, reviewed_at) ON public.leave_applications TO authenticated;

REVOKE INSERT, UPDATE ON public.tasks FROM authenticated;
GRANT INSERT (company_id, title, description, priority, due_date) ON public.tasks TO authenticated;
GRANT UPDATE (title, description, priority, due_date) ON public.tasks TO authenticated;

REVOKE INSERT, UPDATE ON public.task_assignments FROM authenticated;
GRANT INSERT (task_id, employee_id, assignment_reason) ON public.task_assignments TO authenticated;
GRANT UPDATE (status, completed_at) ON public.task_assignments TO authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.business_rules FROM authenticated;
GRANT INSERT (company_id, rule_key, rule_value, version, is_active, effective_from) ON public.business_rules TO authenticated;
GRANT UPDATE (rule_value, version, is_active, effective_from) ON public.business_rules TO authenticated;
GRANT DELETE ON public.business_rules TO authenticated;
