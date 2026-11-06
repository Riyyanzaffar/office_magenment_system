/*
# Add registration review metadata

1. Purpose
- Adds the minimum review fields needed for Phase 1 employee approval and rejection.
- Preserves all existing HRMS tables and existing data.

2. Modified table
- `profiles`
- Adds `reviewed_by` for the HR or Admin reviewer.
- Adds `reviewed_at` for the decision timestamp.
- Adds `rejection_reason` for the mandatory rejection explanation.
- Adds an index supporting pending-registration queries.

3. Security
- No new client write grants are added.
- Existing RLS and column-restricted profile permissions remain unchanged.
- Server-side review functions will be responsible for writing these protected fields.
*/

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

CREATE INDEX IF NOT EXISTS profiles_company_status_idx
  ON public.profiles(company_id, account_status);
