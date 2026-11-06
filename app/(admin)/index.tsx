import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  Briefcase, CalendarCheck, CalendarOff, Clock, UserCheck,
  UserPlus, Users, Wallet, Building2, Network, Tags, Bell,
  ShieldCheck, FileText, Settings,
} from 'lucide-react-native';

import { ActionButton } from '@/components/ActionButton';
import { InlineMessage } from '@/components/InlineMessage';
import { MetricTile } from '@/components/MetricTile';
import { DashboardData, fetchDashboardData } from '@/lib/dashboard';
import { useAuth } from '@/providers/AuthProvider';

const payrollLabels = {
  draft: 'Draft',
  calculating: 'Calculating',
  under_review: 'Under review',
  approved: 'Approved',
  locked: 'Locked',
} as const;

type QuickAction = {
  label: string;
  icon: typeof Building2;
  route: string;
};

const quickActions: QuickAction[] = [
  { label: 'Company Settings', icon: Building2, route: '/(admin)/company' },
  { label: 'Departments', icon: Network, route: '/(admin)/departments' },
  { label: 'Designations', icon: Tags, route: '/(admin)/designations' },
  { label: 'Employees', icon: Users, route: '/(admin)/employees' },
];

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatActivityAction(action: string): string {
  return action
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AdminHomeScreen() {
  const { profile } = useAuth();
  const companyId = profile?.company_id ?? null;
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!companyId) {
      setError('Your account is not linked to a company.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setData(await fetchDashboardData(companyId));
    } catch (err) {
      setError(err instanceof Error && /fetch/i.test(err.message)
        ? 'Unable to connect. Please check your internet connection.'
        : 'Dashboard data could not be loaded. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !data) {
    return <View style={styles.center}><ActivityIndicator color="#DDF2E7" size="large" /></View>;
  }

  const stats = data?.stats;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.heroEyebrow}>SMART ATTENDANCE HRMS</Text>
            <Text style={styles.heroTitle}>Welcome, {profile?.display_name || 'Administrator'}</Text>
            <Text style={styles.heroDate}>{formatDate()}</Text>
          </View>
          <View style={styles.heroBadge}>
            <ShieldCheck color="#DDF2E7" size={16} strokeWidth={2} />
            <Text style={styles.heroBadgeText}>Admin</Text>
          </View>
        </View>
        <View style={styles.heroAccessRow}>
          <Bell color="#DDF2E7" size={14} strokeWidth={2} />
          <Text style={styles.heroAccess}>Full system access verified</Text>
        </View>
      </View>

      {error ? <InlineMessage message={error} /> : null}

      {stats ? (
        <>
          <Text style={styles.sectionLabel}>Workforce Analytics</Text>
          <View style={styles.grid}>
            <MetricTile label="Total Employees" value={String(stats.totalEmployees)} icon={Users} accent="navy" />
            <MetricTile label="Active Employees" value={String(stats.activeEmployees)} icon={UserCheck} accent="green" />
            <MetricTile label="HR Managers" value={String(stats.hrManagers)} icon={Briefcase} accent="gold" />
            <MetricTile label="Pending Registrations" value={String(stats.pendingRegistrations)} icon={UserPlus} accent="warning" />
          </View>

          <Text style={styles.sectionLabel}>Attendance Today</Text>
          <View style={styles.grid}>
            <MetricTile label="Attendance Marked" value={String(stats.todayAttendance)} icon={CalendarCheck} accent="green" subtitle="Check-ins recorded" />
            <MetricTile label="Late Arrivals" value={String(stats.lateToday)} icon={Clock} accent="warning" subtitle="After grace period" />
            <MetricTile label="On Approved Leave" value={String(stats.onLeaveToday)} icon={CalendarOff} accent="navy" subtitle="Leave covering today" />
          </View>

          <Text style={styles.sectionLabel}>Payroll Overview</Text>
          <View style={styles.payrollCard}>
            <View style={styles.payrollIcon}>
              <Wallet color="#DDF2E7" size={20} strokeWidth={2} />
            </View>
            <View style={styles.payrollInfo}>
              {stats.latestPayroll ? (
                <>
                  <Text style={styles.payrollStatus}>{payrollLabels[stats.latestPayroll.status]}</Text>
                  <Text style={styles.payrollPeriod}>{stats.latestPayroll.periodStart} to {stats.latestPayroll.periodEnd}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.payrollStatus}>No payroll period yet</Text>
                  <Text style={styles.payrollPeriod}>Periods appear here once payroll is set up.</Text>
                </>
              )}
            </View>
          </View>

          <Text style={styles.sectionLabel}>Quick Actions</Text>
          <View style={styles.quickActions}>
            {quickActions.map((action) => (
              <Pressable
                key={action.label}
                accessibilityRole="button"
                style={({ pressed }) => [styles.quickBtn, pressed && styles.quickBtnPressed]}
                onPress={() => router.push(action.route as never)}
              >
                <action.icon color="#143B4A" size={20} strokeWidth={2} />
                <Text style={styles.quickBtnLabel}>{action.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Recent Activity</Text>
          {data && data.recentActivity.length > 0 ? (
            <View style={styles.activityCard}>
              {data.recentActivity.map((item, index) => (
                <View key={item.id} style={[styles.activityItem, index < data.recentActivity.length - 1 && styles.activityItemBorder]}>
                  <View style={styles.activityIcon}>
                    <FileText color="#2F6B57" size={14} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.activityAction}>{formatActivityAction(item.action)}</Text>
                    <Text style={styles.activityMeta}>
                      {item.actorEmail ?? 'System'} - {formatTimeAgo(item.createdAt)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No recent activity</Text>
              <Text style={styles.emptyHint}>Configuration changes and approvals will appear here.</Text>
            </View>
          )}
        </>
      ) : null}

      <View style={styles.refreshRow}>
        <ActionButton label="Refresh Dashboard" variant="secondary" loading={loading} onPress={() => void load()} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F5EE' },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F5EE' },
  hero: { backgroundColor: '#143B4A', borderRadius: 22, padding: 22, gap: 14 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroEyebrow: { color: '#8AB8A8', fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  heroTitle: { color: '#FFFFFF', fontSize: 22, lineHeight: 28, fontWeight: '800' },
  heroDate: { color: '#B8CCC4', fontSize: 13, lineHeight: 18 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(221,242,231,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  heroBadgeText: { color: '#DDF2E7', fontSize: 12, fontWeight: '700' },
  heroAccessRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroAccess: { color: '#B8CCC4', fontSize: 12 },
  sectionLabel: { color: '#143B4A', fontSize: 15, fontWeight: '800', marginTop: 6, letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  payrollCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#143B4A', borderRadius: 18, padding: 18 },
  payrollIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(221,242,231,0.15)', justifyContent: 'center', alignItems: 'center' },
  payrollInfo: { flex: 1, gap: 3 },
  payrollStatus: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  payrollPeriod: { color: '#B8CCC4', fontSize: 13, lineHeight: 18 },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickBtn: { flexGrow: 1, flexBasis: 160, minWidth: 160, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E4E8E3' },
  quickBtnPressed: { opacity: 0.7 },
  quickBtnLabel: { color: '#143B4A', fontSize: 14, fontWeight: '700' },
  activityCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: '#E4E8E3' },
  activityItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  activityItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F0F2EF', paddingBottom: 12 },
  activityIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#E4F4EA', justifyContent: 'center', alignItems: 'center' },
  activityAction: { color: '#142A33', fontSize: 14, fontWeight: '700' },
  activityMeta: { color: '#5E6D73', fontSize: 12 },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 28, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#E4E8E3' },
  emptyTitle: { color: '#142A33', fontSize: 15, fontWeight: '800' },
  emptyHint: { color: '#5E6D73', fontSize: 13, textAlign: 'center', lineHeight: 18 },
  refreshRow: { marginTop: 8 },
});
