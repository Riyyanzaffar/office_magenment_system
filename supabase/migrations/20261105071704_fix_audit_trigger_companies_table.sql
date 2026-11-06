/*
# Fix audit trigger for companies table

## Problem
The audit trigger function `audit_company_configuration_change()` assumes every table
has a `company_id` column. The `companies` table itself does not — its primary key IS
the company id. When an admin updates company settings, the AFTER UPDATE trigger fires,
tries to read `NEW.company_id`, and crashes with "record new has no field company_id".
This blocks every company settings save.

## Fix
Rewrite the trigger function to handle tables that have `company_id` and the `companies`
table (which uses its own `id` as the company identifier) separately.

## Security
The function remains SECURITY DEFINER and revoked from public/anon/authenticated.
No policy or grant changes.
*/

CREATE OR REPLACE FUNCTION public.audit_company_configuration_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row_company_id uuid;
BEGIN
  IF TG_TABLE_NAME = 'companies' THEN
    row_company_id := NEW.id;
  ELSE
    row_company_id := NEW.company_id;
  END IF;

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
