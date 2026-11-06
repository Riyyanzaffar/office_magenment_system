/*
# Admin function to change HR account status

## Purpose
Admins need to activate or suspend HR accounts from the app. The profiles table
does not allow authenticated users to update account_status directly (only
display_name, avatar, language, theme). This function provides a secure,
admin-only way to change an HR user's account_status.

## Security
- SECURITY DEFINER function, callable only by authenticated users.
- Verifies the caller is an active admin in the same company as the target HR user.
- Only allows changing account_status to 'active' or 'suspended'.
- Only targets users with role 'hr' (cannot affect admins or employees).
- Audit logged.
- REVOKE EXECUTE from PUBLIC, anon; GRANT to authenticated only.
*/

CREATE OR REPLACE FUNCTION public.set_hr_account_status(target_user_id uuid, new_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid;
  caller_company_id uuid;
  target_company_id uuid;
  target_role text;
  target_current_status text;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT company_id INTO caller_company_id FROM profiles WHERE id = caller_id AND role = 'admin' AND account_status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Only authorized admins can change HR account status';
  END IF;

  IF new_status NOT IN ('active', 'suspended') THEN
    RAISE EXCEPTION 'Invalid status value';
  END IF;

  SELECT company_id, role, account_status INTO target_company_id, target_role, target_current_status
  FROM profiles WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;

  IF target_role <> 'hr' THEN
    RAISE EXCEPTION 'Only HR accounts can be managed through this function';
  END IF;

  IF target_company_id <> caller_company_id THEN
    RAISE EXCEPTION 'You can only manage users in your own company';
  END IF;

  UPDATE profiles SET account_status = new_status, updated_at = now() WHERE id = target_user_id;

  INSERT INTO audit_logs (company_id, actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    caller_company_id,
    caller_id,
    'hr_account_status_changed',
    'profile',
    target_user_id,
    jsonb_build_object('previous_status', target_current_status, 'new_status', new_status)
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_hr_account_status(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_hr_account_status(uuid, text) TO authenticated;
