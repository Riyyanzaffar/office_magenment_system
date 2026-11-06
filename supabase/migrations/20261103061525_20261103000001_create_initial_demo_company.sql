/*
# Create the initial demo company record

1. Purpose
- Provisions the single company required for employee registration.
- The register-employee edge function assigns every new registration to this company.

2. New data
- One row in `companies`:
  - name: Smart Attendance Demo Company
  - legal_name: Smart Attendance Demo Company
  - timezone: Asia/Karachi
  - contact_email: YOUR_EMAIL_HERE

3. Security
- No table, policy, or grant changes.
- No authentication user or admin role is created.
*/

INSERT INTO public.companies (name, legal_name, timezone, contact_email)
VALUES ('Smart Attendance Demo Company', 'Smart Attendance Demo Company', 'Asia/Karachi', 'YOUR_EMAIL_HERE');
