/*
# Update demo company contact email

1. Purpose
- Corrects the contact email on the existing demo company record.
- Only the contact_email column is changed.

2. Changes
- companies row with id 675eaee1-bd99-45c7-bba8-6411324880fa
  - contact_email: YOUR_EMAIL_HERE -> zaffarrazzaq2@gamil.com

3. Security
- No table, policy, grant, or function changes.
- No authentication user or admin role created.
*/

UPDATE public.companies
SET contact_email = 'zaffarrazzaq2@gamil.com',
    updated_at = now()
WHERE id = '675eaee1-bd99-45c7-bba8-6411324880fa';
