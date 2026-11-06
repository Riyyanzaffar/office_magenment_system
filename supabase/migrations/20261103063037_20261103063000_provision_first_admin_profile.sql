/*
# Provision first Admin profile

1. Purpose
- Creates the admin profile for the existing authentication user.
- No new auth user or company is created.

2. Pre-flight checks (verified before migration)
- Exactly 1 auth user with email zaffarrazzaq2@gmail.com (id 6bb9afe2-5bf0-4e28-80dc-8e23e0a46a48)
- Exactly 1 company with id 675eaee1-bd99-45c7-bba8-6411324880fa
- No existing profile for this email

3. Changes
- Inserts one row into public.profiles:
  - id: 6bb9afe2-5bf0-4e28-80dc-8e23e0a46a48  (preserves existing auth user id)
  - company_id: 675eaee1-bd99-45c7-bba8-6411324880fa
  - email: zaffarrazzaq2@gmail.com
  - display_name: System Administrator
  - role: admin
  - account_status: active

4. Security
- No table, policy, grant, or function changes.
- No other user's role or profile is touched.
*/

INSERT INTO public.profiles (id, company_id, email, display_name, role, account_status)
VALUES (
  '6bb9afe2-5bf0-4e28-80dc-8e23e0a46a48',
  '675eaee1-bd99-45c7-bba8-6411324880fa',
  'zaffarrazzaq2@gmail.com',
  'System Administrator',
  'admin',
  'active'
);
