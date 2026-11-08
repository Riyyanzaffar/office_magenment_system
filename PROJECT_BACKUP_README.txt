SMART ATTENDANCE & HRMS — PROJECT BACKUP README
================================================

Backup date: 7 November 2026 (based on the File Explorer screenshots)
Project: Smart Attendance & HR Management System
Platform: Expo / React Native / TypeScript / Bolt Database

1. SOURCE CODE BACKUP
---------------------
GitHub repository:
  Riyyanzaffar/office_magenment_system

Repository visibility:
  Private (confirmed by the project owner)

Bolt GitHub status:
  Synced to GitHub (shown in the Bolt status popup)

Visible project folders/files include:
  .bolt/
  app/
  assets/images/
  components/
  hooks/
  lib/
  providers/
  supabase/
  types/
  app.json
  package.json
  package-lock.json

Important:
  - This GitHub repository is the source-code backup.
  - Confirm that the latest changes are committed before relying on it for recovery.
  - Never commit .env files, service-role keys, passwords, access tokens, or other secrets.

2. DATABASE ROW EXPORTS
-----------------------
Local backup folder shown in File Explorer:
  D:\DocumentsSmart-Attendance-Backup

The following populated tables were exported as JSON:
  - companies_export.json       (1 row)
  - profiles_export.json        (4 rows)
  - employees_export.json       (2 rows)
  - office_locations_export.json (1 row)
  - departments_export.json     (7 rows)
  - designations_export.json   (8 rows)
  - audit_logs_export.json      (24 rows)

The other tables showed 0 rows at the time of export and were skipped.

The database screenshot showed these 21 tables:
  companies
  profiles
  employees
  office_locations
  working_schedules
  public_holidays
  business_rules
  leave_types
  leave_balances
  leave_applications
  attendance_records
  attendance_events
  tasks
  task_assignments
  salary_structures
  payroll_periods
  payroll_calculations
  payslips
  audit_logs
  departments
  designations

Important:
  - These JSON files are row-data exports, not a complete database backup.
  - They do not by themselves preserve table definitions, indexes, foreign keys,
    RLS policies, database functions, triggers, Auth users, Storage objects,
    Edge Function secrets, or project configuration.
  - Keep these exports private. Profiles and employee exports may contain
    personal or other confidential company information.
  - Do not upload these JSON exports to the GitHub repository.

3. COMPANY / ADMIN REFERENCE
----------------------------
Company:
  Smart Attendance Demo Company

Company ID:
  675eaee1-bd99-45c7-bba8-6411324880fa

Timezone:
  Asia/Karachi

Company contact email:
  zaffarrazzaq2@gmail.com

First Admin email:
  zaffarrazzaq2@gmail.com

First Admin role/status:
  admin / active (verified in the project conversation)

Do not store the Admin password in this file. The password must remain private.

4. DATABASE SCHEMA / SECURITY / SERVER BACKUP
---------------------------------------------
The GitHub repository visibly contains a supabase/ folder. It is expected to
hold migrations and Edge Function source code. Before relying on it for a full
restore, inspect the latest GitHub commit and confirm it includes every
migration and function deployed after the last sync.

A complete recovery set should also preserve, through secure and appropriate
methods:
  - Database schema and migrations
  - RLS policies and grants
  - Database functions and triggers
  - Edge Function source and deployment configuration
  - Required environment variable NAMES (not their values in public files)
  - Secret values recreated securely in the destination project
  - Authentication user recovery/provisioning plan
  - Private Storage objects, if any

Never place service-role credentials or production secrets in GitHub or this
README. Recreate them in the destination project's secure Secrets settings.

5. SAFE RESTORE NOTES
---------------------
Do not import the JSON exports into a new or existing database blindly.

Before restoring:
  1. Restore/verify the schema and migrations first.
  2. Restore company records before company-dependent records.
  3. Restore profiles and employees only after checking their Auth user IDs.
  4. Restore parent records before child records to satisfy foreign keys.
  5. Review RLS policies, grants, triggers and functions before enabling access.
  6. Recreate Edge Function secrets securely.
  7. Test authentication and role permissions before allowing users in.

The JSON exports do not automatically restore Supabase Auth credentials or
passwords. Do not expect importing profiles.json to recreate login accounts.

6. CURRENT DEVELOPMENT NOTES
----------------------------
The project uses Expo SDK 57 and React Native. The Admin area, Company
Settings, Departments, Designations, HR management screens, and related
backend work have been developed in stages. Browser/device testing has
remained necessary for several workflows, including HR directory access,
email delivery, password reset, GPS permission behavior, and approval flows.

Do not assume every feature is production-ready merely because TypeScript or a
web build passed. Repeat live tests after restoring or changing environments.

7. SECURITY REMINDERS
---------------------
  - Keep the GitHub repository private.
  - Keep database JSON exports in a private local folder.
  - Do not share profiles_export.json or employees_export.json publicly.
  - Never disable RLS as a troubleshooting shortcut.
  - Never put a service-role key in the Expo/mobile app.
  - Do not store passwords in this README or in source control.

END OF BACKUP README
