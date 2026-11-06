// Smart Attendance HRMS - HR/Admin registration review
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const authClient = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type ReviewPayload = {
  profileId?: unknown;
  decision?: unknown;
  reason?: unknown;
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const authorization = request.headers.get('Authorization');
    const token = authorization?.replace(/^Bearer\s+/i, '');
    if (!token) return jsonResponse({ error: 'Unauthorized.' }, 401);

    const { data: userData, error: userError } = await authClient.auth.getUser(token);
    if (userError || !userData.user) return jsonResponse({ error: 'Unauthorized.' }, 401);

    const actorId = userData.user.id;
    const { data: actor, error: actorError } = await adminClient
      .from('profiles')
      .select('id, company_id, role, account_status')
      .eq('id', actorId)
      .maybeSingle();

    if (actorError || !actor || actor.account_status !== 'active' || !['admin', 'hr'].includes(actor.role) || !actor.company_id) {
      return jsonResponse({ error: 'You are not allowed to review registrations.' }, 403);
    }

    const payload = (await request.json()) as ReviewPayload;
    const profileId = typeof payload.profileId === 'string' ? payload.profileId : '';
    const decision = payload.decision === 'approved' || payload.decision === 'rejected' ? payload.decision : '';
    const reason = typeof payload.reason === 'string' ? payload.reason.trim() : '';

    if (!profileId || !decision || (decision === 'rejected' && (reason.length < 3 || reason.length > 500))) {
      return jsonResponse({ error: 'A valid decision and rejection reason are required.' }, 400);
    }

    const { data: target, error: targetError } = await adminClient
      .from('profiles')
      .select('id, company_id, account_status, display_name, email')
      .eq('id', profileId)
      .maybeSingle();

    if (targetError || !target || target.company_id !== actor.company_id || target.account_status !== 'pending') {
      return jsonResponse({ error: 'Registration is not available for review.' }, 404);
    }

    const now = new Date().toISOString();
    const approved = decision === 'approved';
    const { error: profileUpdateError } = await adminClient
      .from('profiles')
      .update({
        account_status: approved ? 'active' : 'rejected',
        approved_by: approved ? actorId : null,
        approved_at: approved ? now : null,
        reviewed_by: actorId,
        reviewed_at: now,
        rejection_reason: approved ? null : reason,
      })
      .eq('id', profileId)
      .eq('company_id', actor.company_id)
      .eq('account_status', 'pending');

    if (profileUpdateError) return jsonResponse({ error: 'Unable to save the review.' }, 500);

    const { error: employeeUpdateError } = await adminClient
      .from('employees')
      .update({ employment_status: approved ? 'active' : 'inactive' })
      .eq('profile_id', profileId)
      .eq('company_id', actor.company_id);

    if (employeeUpdateError) return jsonResponse({ error: 'Unable to complete the review.' }, 500);

    await adminClient.from('audit_logs').insert({
      company_id: actor.company_id,
      actor_id: actorId,
      action: approved ? 'employee_registration_approved' : 'employee_registration_rejected',
      entity_type: 'profile',
      entity_id: profileId,
      metadata: approved ? {} : { reason },
    });

    return jsonResponse({ success: true, decision });
  } catch {
    return jsonResponse({ error: 'Unable to complete the review.' }, 500);
  }
});
