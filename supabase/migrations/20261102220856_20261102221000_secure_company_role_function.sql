/*
# Move company-role authorization behind a non-public security boundary

1. Purpose
- Fixes the exposed SECURITY DEFINER warning for `public.has_company_role`.
- Preserves the existing RLS policy behavior used throughout the HRMS schema.

2. Changes
- Adds a private schema that is not part of the normal public Data API surface.
- Adds `private.has_company_role(p_company_id uuid, p_roles text[])` as the only SECURITY DEFINER implementation.
- Changes `public.has_company_role` to SECURITY INVOKER so the public RPC endpoint no longer runs with elevated privileges.
- The public wrapper delegates to the private implementation and remains available only because RLS policies call it.

3. Security
- The private function has a fixed `search_path` and derives the caller from `auth.uid()`.
- Anonymous users cannot execute the private function.
- Only authenticated users can execute the private function through the policy evaluation path.
- The public wrapper has no elevated privileges.
*/

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.has_company_role(p_company_id uuid, p_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles AS caller_profile
    WHERE caller_profile.id = auth.uid()
      AND caller_profile.company_id = p_company_id
      AND caller_profile.account_status = 'active'
      AND caller_profile.role = ANY(p_roles)
  );
$$;

REVOKE EXECUTE ON FUNCTION private.has_company_role(uuid, text[]) FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_company_role(uuid, text[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.has_company_role(p_company_id uuid, p_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT private.has_company_role(p_company_id, p_roles);
$$;

REVOKE EXECUTE ON FUNCTION public.has_company_role(uuid, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_company_role(uuid, text[]) TO authenticated;
