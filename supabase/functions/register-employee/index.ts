// Smart Attendance HRMS - secure employee registration
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type RegistrationPayload = {
  fullName?: unknown;
  employeeId?: unknown;
  designation?: unknown;
  email?: unknown;
  password?: unknown;
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function cleanText(value: unknown, minLength: number, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim();
  return cleaned.length >= minLength && cleaned.length <= maxLength ? cleaned : null;
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.split(/\s+/);
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ') || parts[0],
  };
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const payload = (await request.json()) as RegistrationPayload;
    const fullName = cleanText(payload.fullName, 2, 120);
    const employeeId = cleanText(payload.employeeId, 1, 50);
    const designation = cleanText(payload.designation, 2, 120);
    const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
    const password = typeof payload.password === 'string' ? payload.password : '';

    if (!fullName || !employeeId || !designation || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || password.length > 128) {
      return jsonResponse({ error: 'Please provide valid registration details.' }, 400);
    }

    const { data: companies, error: companyError } = await adminClient
      .from('companies')
      .select('id')
      .limit(2);

    if (companyError || !companies || companies.length !== 1) {
      return jsonResponse({ error: 'Organization setup is not ready.' }, 409);
    }

    const companyId = companies[0].id as string;
    const { firstName, lastName } = splitName(fullName);
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
    });

    if (authError || !authData.user) {
      return jsonResponse({ error: 'Unable to create the account.' }, 400);
    }

    const userId = authData.user.id;
    const { error: profileError } = await adminClient.from('profiles').insert({
      id: userId,
      company_id: companyId,
      email,
      display_name: fullName,
      role: 'employee',
      account_status: 'pending',
    });

    const { data: employeeRecord, error: employeeError } = profileError
      ? { data: null, error: profileError }
      : await adminClient.from('employees').insert({
          profile_id: userId,
          company_id: companyId,
          employee_number: employeeId,
          first_name: firstName,
          last_name: lastName,
          job_title: designation,
          employment_status: 'inactive',
        }).select('id').maybeSingle();

    if (profileError || employeeError || !employeeRecord) {
      await adminClient.auth.admin.deleteUser(userId);
      return jsonResponse({ error: 'Unable to complete registration.' }, 400);
    }

    await adminClient.from('audit_logs').insert({
      company_id: companyId,
      actor_id: userId,
      action: 'employee_registration_submitted',
      entity_type: 'profile',
      entity_id: userId,
      metadata: { employee_id: employeeRecord.id },
    });

    return jsonResponse({ success: true, emailVerificationRequired: true });
  } catch {
    return jsonResponse({ error: 'Unable to complete registration.' }, 500);
  }
});
