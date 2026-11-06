// Smart Attendance HRMS - Admin creates an HR user (v2)
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

type HRPayload = {
  fullName?: unknown;
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

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Authentication required.' }, 401);
    }

    const callerClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: authHeader } },
    });

    const { data: callerData, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !callerData.user) {
      return jsonResponse({ error: 'Authentication required.' }, 401);
    }

    const callerId = callerData.user.id;
    const { data: callerProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, company_id, role, account_status')
      .eq('id', callerId)
      .maybeSingle();

    if (profileError || !callerProfile) {
      return jsonResponse({ error: 'Your account could not be verified.' }, 403);
    }

    if (callerProfile.role !== 'admin' || callerProfile.account_status !== 'active') {
      return jsonResponse({ error: 'Only authorized admins can create HR users.' }, 403);
    }

    const companyId = callerProfile.company_id as string;
    const payload = (await request.json()) as HRPayload;
    const fullName = cleanText(payload.fullName, 2, 120);
    const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
    const password = typeof payload.password === 'string' ? payload.password : '';

    if (!fullName || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || password.length > 128) {
      return jsonResponse({ error: 'Please provide a valid name, email and a password of at least 8 characters.' }, 400);
    }

    const { data: existingUser } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return jsonResponse({ error: 'An account with this email already exists.' }, 409);
    }

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      const msg = authError?.message ?? '';
      if (msg.includes('already')) {
        return jsonResponse({ error: 'An account with this email already exists.' }, 409);
      }
      return jsonResponse({ error: 'Unable to create the HR account.' }, 400);
    }

    const userId = authData.user.id;
    const { error: hrProfileError } = await adminClient.from('profiles').insert({
      id: userId,
      company_id: companyId,
      email,
      display_name: fullName,
      role: 'hr',
      account_status: 'active',
      approved_by: callerId,
      approved_at: new Date().toISOString(),
    });

    if (hrProfileError) {
      await adminClient.auth.admin.deleteUser(userId);
      return jsonResponse({ error: 'Unable to create the HR profile.' }, 400);
    }

    await adminClient.from('audit_logs').insert({
      company_id: companyId,
      actor_id: callerId,
      action: 'hr_user_created',
      entity_type: 'profile',
      entity_id: userId,
      metadata: { email, display_name: fullName },
    });

    return jsonResponse({ success: true, userId, email });
  } catch {
    return jsonResponse({ error: 'Something went wrong. Please try again.' }, 500);
  }
});
