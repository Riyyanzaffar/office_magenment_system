import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CheckCircle, XCircle, Clock } from 'lucide-react-native';

import { ActionButton } from '@/components/ActionButton';
import { InlineMessage } from '@/components/InlineMessage';
import { ModalSheet } from '@/components/ModalSheet';
import { PendingRegistration, fetchPendingRegistrations, reviewEmployeeRegistration } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';

export default function PendingRegistrationsScreen() {
  const { profile } = useAuth();
  const companyId = profile?.company_id ?? null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<PendingRegistration[]>([]);
  const [reviewing, setReviewing] = useState<PendingRegistration | null>(null);
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!companyId) {
      setError('Your account is not linked to a company.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setRegistrations(await fetchPendingRegistrations(companyId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pending registrations could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const openReview = (reg: PendingRegistration, dec: 'approved' | 'rejected') => {
    setReviewing(reg);
    setDecision(dec);
    setReason('');
    setReviewError(null);
  };

  const submitReview = async () => {
    if (!reviewing || !decision) return;
    if (decision === 'rejected' && reason.trim().length < 3) {
      setReviewError('A rejection reason is required.');
      return;
    }
    setSubmitting(true);
    setReviewError(null);
    try {
      await reviewEmployeeRegistration(reviewing.id, decision, decision === 'rejected' ? reason.trim() : undefined);
      setReviewing(null);
      void load();
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Review could not be completed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && registrations.length === 0) {
    return <View style={styles.center}><ActivityIndicator color="#143B4A" size="large" /></View>;
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.eyebrow}>APPROVALS</Text>
          <Text style={styles.title}>Pending Registrations</Text>
          <Text style={styles.subtitle}>Review employee registration requests awaiting approval.</Text>
        </View>

        {error ? <InlineMessage message={error} /> : null}

        {registrations.length === 0 ? (
          <View style={styles.empty}>
            <Clock color="#809096" size={28} strokeWidth={2} />
            <Text style={styles.emptyTitle}>No pending registrations</Text>
            <Text style={styles.emptyHint}>New employee registration requests will appear here for review.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {registrations.map((reg) => (
              <View key={reg.id} style={styles.card}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{reg.display_name ?? 'Unnamed'}</Text>
                  <Text style={styles.cardEmail}>{reg.email}</Text>
                  <Text style={styles.cardDate}>Submitted {new Date(reg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                </View>
                <View style={styles.cardActions}>
                  <Pressable accessibilityRole="button" style={({ pressed }) => [styles.actionBtn, styles.approveBtn, pressed && styles.pressed]} onPress={() => openReview(reg, 'approved')}>
                    <CheckCircle color="#2F6B57" size={16} strokeWidth={2} />
                    <Text style={styles.approveText}>Approve</Text>
                  </Pressable>
                  <Pressable accessibilityRole="button" style={({ pressed }) => [styles.actionBtn, styles.rejectBtn, pressed && styles.pressed]} onPress={() => openReview(reg, 'rejected')}>
                    <XCircle color="#A34444" size={16} strokeWidth={2} />
                    <Text style={styles.rejectText}>Reject</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <ModalSheet
        visible={reviewing !== null}
        title={decision === 'approved' ? 'Approve Registration' : 'Reject Registration'}
        onClose={() => setReviewing(null)}
      >
        {reviewing ? (
          <>
            <View style={styles.reviewInfo}>
              <Text style={styles.reviewName}>{reviewing.display_name ?? 'Unnamed'}</Text>
              <Text style={styles.reviewEmail}>{reviewing.email}</Text>
            </View>
            {decision === 'rejected' ? (
              <>
                <Text style={styles.label}>Rejection reason (required)</Text>
                <TextInput
                  style={styles.reasonInput}
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Explain why this registration is being rejected"
                  placeholderTextColor="#8A989D"
                  multiline
                  textAlignVertical="top"
                />
              </>
            ) : (
              <Text style={styles.approveHint}>The employee will be activated and can sign in to the app.</Text>
            )}
            {reviewError ? <InlineMessage message={reviewError} /> : null}
            <ActionButton
              label={decision === 'approved' ? 'Confirm Approval' : 'Confirm Rejection'}
              onPress={() => void submitReview()}
              loading={submitting}
            />
          </>
        ) : null}
      </ModalSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F5EE' },
  content: { padding: 24, gap: 16, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F5EE' },
  header: { gap: 6, paddingTop: 8 },
  eyebrow: { color: '#2F6B57', fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  title: { color: '#142A33', fontSize: 28, lineHeight: 34, fontWeight: '800' },
  subtitle: { color: '#5E6D73', fontSize: 15, lineHeight: 22 },
  list: { gap: 12 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, gap: 14, borderWidth: 1, borderColor: '#E4E8E3' },
  cardInfo: { gap: 4 },
  cardName: { color: '#142A33', fontSize: 16, fontWeight: '800' },
  cardEmail: { color: '#5E6D73', fontSize: 14 },
  cardDate: { color: '#809096', fontSize: 12 },
  cardActions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  approveBtn: { backgroundColor: '#DDF2E7', borderColor: '#C3E4D2' },
  rejectBtn: { backgroundColor: '#F0E8E8', borderColor: '#E0D0D0' },
  pressed: { opacity: 0.7 },
  approveText: { color: '#2F6B57', fontSize: 13, fontWeight: '700' },
  rejectText: { color: '#A34444', fontSize: 13, fontWeight: '700' },
  empty: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 32, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#E4E8E3' },
  emptyTitle: { color: '#142A33', fontSize: 16, fontWeight: '800' },
  emptyHint: { color: '#5E6D73', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  reviewInfo: { backgroundColor: '#F0F4F1', borderRadius: 12, padding: 16, gap: 4 },
  reviewName: { color: '#142A33', fontSize: 16, fontWeight: '800' },
  reviewEmail: { color: '#5E6D73', fontSize: 14 },
  label: { color: '#29424B', fontSize: 13, fontWeight: '700' },
  reasonInput: { minHeight: 80, borderWidth: 1, borderColor: '#D5DEE1', borderRadius: 12, backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 12, color: '#142A33', fontSize: 15, textAlignVertical: 'top' },
  approveHint: { color: '#2F6B57', fontSize: 14, lineHeight: 20 },
});
