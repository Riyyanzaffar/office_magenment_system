import { supabase } from '@/lib/supabase';

export type PayrollStatus = 'draft' | 'calculating' | 'under_review' | 'approved' | 'locked';

export type DashboardStats = {
  totalEmployees: number;
  activeEmployees: number;
  hrManagers: number;
  pendingRegistrations: number;
  todayAttendance: number;
  lateToday: number;
  onLeaveToday: number;
  latestPayroll: { periodStart: string; periodEnd: string; status: PayrollStatus } | null;
};

export type RecentActivity = {
  id: string;
  action: string;
  entityType: string;
  actorEmail: string | null;
  createdAt: string;
};

export type DashboardData = {
  stats: DashboardStats;
  recentActivity: RecentActivity[];
};

function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

async function countRows(query: PromiseLike<{ count: number | null; error: { message: string } | null }>): Promise<number> {
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function fetchDashboardStats(companyId: string): Promise<DashboardStats> {
  const today = todayIsoDate();

  const [
    totalEmployees,
    activeEmployees,
    hrManagers,
    todayAttendance,
    lateToday,
    onLeaveToday,
    pendingRegistrations,
    payroll,
  ] = await Promise.all([
    countRows(supabase.from('employees').select('id', { count: 'exact', head: true }).eq('company_id', companyId)),
    countRows(supabase.from('employees').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('employment_status', 'active')),
    countRows(supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('role', 'hr').eq('account_status', 'active')),
    countRows(supabase.from('attendance_records').select('id', { count: 'exact', head: true }).eq('attendance_date', today)),
    countRows(supabase.from('attendance_records').select('id', { count: 'exact', head: true }).eq('attendance_date', today).gt('late_minutes', 0)),
    countRows(supabase.from('leave_applications').select('id', { count: 'exact', head: true }).eq('status', 'approved').lte('start_date', today).gte('end_date', today)),
    countRows(supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('account_status', 'pending')),
    supabase.from('payroll_periods').select('period_start, period_end, status').eq('company_id', companyId).order('period_start', { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (payroll.error) throw new Error(payroll.error.message);

  return {
    totalEmployees,
    activeEmployees,
    hrManagers,
    pendingRegistrations,
    todayAttendance,
    lateToday,
    onLeaveToday,
    latestPayroll: payroll.data
      ? { periodStart: payroll.data.period_start, periodEnd: payroll.data.period_end, status: payroll.data.status as PayrollStatus }
      : null,
  };
}

export async function fetchRecentActivity(companyId: string): Promise<RecentActivity[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, action, entity_type, actor_id, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(8);
  if (error) throw new Error(error.message);

  const actorIds = [...new Set((data ?? []).map((row) => row.actor_id).filter(Boolean) as string[])];
  const actorMap = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: actors } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', actorIds);
    for (const actor of actors ?? []) {
      actorMap.set(actor.id as string, actor.email as string);
    }
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    action: row.action as string,
    entityType: row.entity_type as string,
    actorEmail: row.actor_id ? (actorMap.get(row.actor_id as string) ?? null) : null,
    createdAt: row.created_at as string,
  }));
}

export async function fetchDashboardData(companyId: string): Promise<DashboardData> {
  const [stats, recentActivity] = await Promise.all([
    fetchDashboardStats(companyId),
    fetchRecentActivity(companyId).catch(() => [] as RecentActivity[]),
  ]);
  return { stats, recentActivity };
}
