import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MapPin, Navigation, ExternalLink } from 'lucide-react-native';

import { ActionButton } from '@/components/ActionButton';
import { ChoiceChips } from '@/components/ChoiceChips';
import { FormField } from '@/components/FormField';
import { InlineMessage } from '@/components/InlineMessage';
import {
  Company,
  CompanyForm,
  FormErrors,
  OfficeForm,
  OfficeLocation,
  WorkingDay,
  companyToForm,
  fetchCompany,
  fetchPrimaryOffice,
  officeToForm,
  saveCompany,
  savePrimaryOffice,
  validateCompanyForm,
  validateOfficeForm,
} from '@/lib/company';
import { useAuth } from '@/providers/AuthProvider';

type Notice = { tone: 'success' | 'error'; message: string } | null;

const dayOptions: { value: WorkingDay; label: string }[] = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 7, label: 'Sun' },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <Text style={styles.fieldError}>{message}</Text> : null;
}

export default function CompanySettingsScreen() {
  const { profile } = useAuth();
  const companyId = profile?.company_id ?? null;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [form, setForm] = useState<CompanyForm | null>(null);
  const [companyErrors, setCompanyErrors] = useState<FormErrors<CompanyForm>>({});
  const [companyNotice, setCompanyNotice] = useState<Notice>(null);
  const [savingCompany, setSavingCompany] = useState(false);

  const [office, setOffice] = useState<OfficeLocation | null>(null);
  const [officeForm, setOfficeForm] = useState<OfficeForm | null>(null);
  const [officeErrors, setOfficeErrors] = useState<FormErrors<OfficeForm>>({});
  const [officeNotice, setOfficeNotice] = useState<Notice>(null);
  const [savingOffice, setSavingOffice] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!companyId) {
      setLoadError('Your account is not linked to a company.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const [loadedCompany, loadedOffice] = await Promise.all([fetchCompany(companyId), fetchPrimaryOffice(companyId)]);
      setCompany(loadedCompany);
      setForm(companyToForm(loadedCompany));
      setOffice(loadedOffice);
      setOfficeForm(officeToForm(loadedOffice));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Company information could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateCompany = <K extends keyof CompanyForm>(key: K, value: CompanyForm[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const updateOffice = <K extends keyof OfficeForm>(key: K, value: OfficeForm[K]) => {
    setOfficeForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const toggleWorkingDay = (day: WorkingDay) => {
    if (!form) return;
    const days = form.default_working_days.includes(day)
      ? form.default_working_days.filter((value) => value !== day)
      : [...form.default_working_days, day];
    updateCompany('default_working_days', days);
  };

  const saveCompanyDetails = async () => {
    if (!companyId || !form) return;
    const { errors, payload } = validateCompanyForm(form);
    setCompanyErrors(errors);
    if (!payload) {
      setCompanyNotice({ tone: 'error', message: 'Please correct the highlighted fields before saving.' });
      return;
    }
    setSavingCompany(true);
    setCompanyNotice(null);
    try {
      const saved = await saveCompany(companyId, payload);
      setCompany(saved);
      setForm(companyToForm(saved));
      setCompanyNotice({ tone: 'success', message: 'Company details saved.' });
    } catch (err) {
      setCompanyNotice({ tone: 'error', message: err instanceof Error ? err.message : 'Something went wrong. Please try again.' });
    } finally {
      setSavingCompany(false);
    }
  };

  const useCurrentLocation = async () => {
    setLocating(true);
    setLocationNotice(null);
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            updateOffice('latitude', position.coords.latitude.toFixed(7));
            updateOffice('longitude', position.coords.longitude.toFixed(7));
            setLocationNotice('Location captured. Please confirm the coordinates before saving.');
            setLocating(false);
          },
          (err) => {
            setLocationNotice(err.message || 'Could not get your location. Check that location access is allowed.');
            setLocating(false);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        );
      } else {
        setLocationNotice('Location access is not available on this device.');
        setLocating(false);
      }
    } catch {
      setLocationNotice('Could not get your location. Please enter coordinates manually.');
      setLocating(false);
    }
  };

  const openGoogleMaps = () => {
    if (!officeForm) return;
    const query = officeForm.address || `${officeForm.latitude},${officeForm.longitude}`;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    void Linking.openURL(url);
  };

  const saveOfficeDetails = async () => {
    if (!companyId || !officeForm) return;
    const { errors, payload } = validateOfficeForm(officeForm);
    setOfficeErrors(errors);
    if (!payload) {
      setOfficeNotice({ tone: 'error', message: 'Please correct the highlighted fields before saving.' });
      return;
    }
    setSavingOffice(true);
    setOfficeNotice(null);
    try {
      const saved = await savePrimaryOffice(companyId, office?.id ?? null, payload);
      setOffice(saved);
      setOfficeForm(officeToForm(saved));
      setOfficeNotice({ tone: 'success', message: 'Office details saved.' });
    } catch (err) {
      setOfficeNotice({ tone: 'error', message: err instanceof Error ? err.message : 'Something went wrong. Please try again.' });
    } finally {
      setSavingOffice(false);
    }
  };

  if (loading && !form) {
    return <View style={styles.center}><ActivityIndicator color="#143B4A" size="large" /></View>;
  }

  if (loadError || !form || !officeForm || !company) {
    return (
      <View style={styles.center}>
        <InlineMessage message={loadError ?? 'Company information is unavailable.'} />
        <ActionButton label="Try again" variant="secondary" onPress={() => void load()} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.eyebrow}>COMPANY</Text>
        <Text style={styles.title}>Company settings</Text>
        <Text style={styles.subtitle}>These details appear across the app and guide default attendance and leave rules.</Text>
      </View>

      <Section title="General information">
        <FormField label="Company name" value={form.name} onChangeText={(v) => updateCompany('name', v)} />
        <FieldError message={companyErrors.name} />
        <FormField label="Legal name" value={form.legal_name} onChangeText={(v) => updateCompany('legal_name', v)} />
        <FormField label="Description" value={form.description} onChangeText={(v) => updateCompany('description', v)} multiline />
        <FormField label="Website" value={form.website} onChangeText={(v) => updateCompany('website', v)} autoCapitalize="none" keyboardType="url" />
      </Section>

      <Section title="Contact and address">
        <FormField label="Contact email" value={form.contact_email} onChangeText={(v) => updateCompany('contact_email', v)} autoCapitalize="none" keyboardType="email-address" />
        <FieldError message={companyErrors.contact_email} />
        <FormField label="Contact phone" value={form.phone} onChangeText={(v) => updateCompany('phone', v)} keyboardType="phone-pad" />
        <FormField label="Office address" value={form.address} onChangeText={(v) => updateCompany('address', v)} />
        <FormField label="City" value={form.city} onChangeText={(v) => updateCompany('city', v)} />
        <FormField label="Country" value={form.country} onChangeText={(v) => updateCompany('country', v)} />
        <FormField label="Timezone" value={form.timezone} onChangeText={(v) => updateCompany('timezone', v)} autoCapitalize="none" />
        <FieldError message={companyErrors.timezone} />
      </Section>

      <Section title="Company preferences">
        <Text style={styles.label}>Language</Text>
        <ChoiceChips
          options={[{ value: 'en', label: 'English' }, { value: 'ur', label: 'Urdu' }]}
          selected={[form.language_preference]}
          onPress={(v) => updateCompany('language_preference', v as 'en' | 'ur')}
        />
        <Text style={styles.label}>Currency</Text>
        <Text style={styles.readOnly}>PKR (Pakistani Rupee)</Text>
        <Text style={styles.label}>Default working days</Text>
        <ChoiceChips options={dayOptions} selected={form.default_working_days} onPress={toggleWorkingDay} />
        <FieldError message={companyErrors.default_working_days} />
        <FormField label="Default arrival time (24-hour)" value={form.default_arrival_time} onChangeText={(v) => updateCompany('default_arrival_time', v)} placeholder="09:00" />
        <FieldError message={companyErrors.default_arrival_time} />
        <FormField label="Default departure time (24-hour, optional)" value={form.default_departure_time} onChangeText={(v) => updateCompany('default_departure_time', v)} placeholder="18:00" />
        <FieldError message={companyErrors.default_departure_time} />
        <FormField label="Default grace period (minutes)" value={form.default_grace_minutes} onChangeText={(v) => updateCompany('default_grace_minutes', v)} keyboardType="number-pad" />
        <FieldError message={companyErrors.default_grace_minutes} />
        <FormField label="Default annual paid leave (days)" value={form.default_annual_leave_days} onChangeText={(v) => updateCompany('default_annual_leave_days', v)} keyboardType="number-pad" />
        <FieldError message={companyErrors.default_annual_leave_days} />
        {companyNotice ? <InlineMessage message={companyNotice.message} tone={companyNotice.tone === 'success' ? 'success' : 'error'} /> : null}
        <ActionButton label="Save company details" onPress={() => void saveCompanyDetails()} loading={savingCompany} />
      </Section>

      <Section title="Primary office">
        <FormField label="Office name" value={officeForm.name} onChangeText={(v) => updateOffice('name', v)} />
        <FieldError message={officeErrors.name} />
        <FormField label="Office address" value={officeForm.address} onChangeText={(v) => updateOffice('address', v)} />

        <View style={styles.locationPicker}>
          <Text style={styles.pickerTitle}>GPS Location</Text>
          <Text style={styles.pickerHint}>Use your current location at the office, or find coordinates using Google Maps.</Text>

          <View style={styles.pickerButtons}>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.pickerBtn, pressed && styles.pickerBtnPressed]}
              onPress={() => void useCurrentLocation()}
              disabled={locating}
            >
              <Navigation color="#143B4A" size={16} strokeWidth={2} />
              <Text style={styles.pickerBtnText}>{locating ? 'Locating...' : 'Use Current Location'}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.pickerBtn, pressed && styles.pickerBtnPressed]}
              onPress={openGoogleMaps}
            >
              <ExternalLink color="#143B4A" size={16} strokeWidth={2} />
              <Text style={styles.pickerBtnText}>Open Google Maps</Text>
            </Pressable>
          </View>

          {locationNotice ? <Text style={styles.locationNotice}>{locationNotice}</Text> : null}
        </View>

        <FormField label="GPS latitude" value={officeForm.latitude} onChangeText={(v) => updateOffice('latitude', v)} keyboardType="numbers-and-punctuation" placeholder="e.g. 24.8607" />
        <FieldError message={officeErrors.latitude} />
        <FormField label="GPS longitude" value={officeForm.longitude} onChangeText={(v) => updateOffice('longitude', v)} keyboardType="numbers-and-punctuation" placeholder="e.g. 67.0011" />
        <FieldError message={officeErrors.longitude} />

        {officeForm.latitude && officeForm.longitude ? (
          <View style={styles.coordPreview}>
            <View style={styles.coordPreviewHeader}>
              <MapPin color="#2F6B57" size={16} strokeWidth={2} />
              <Text style={styles.coordPreviewText}>{Number(officeForm.latitude).toFixed(6)}, {Number(officeForm.longitude).toFixed(6)}</Text>
            </View>
            <Text style={styles.coordPreviewHint}>Geofence radius: {officeForm.radius_meters || '100'} metres</Text>
          </View>
        ) : null}

        <FormField label="Geofence radius (metres)" value={officeForm.radius_meters} onChangeText={(v) => updateOffice('radius_meters', v)} keyboardType="number-pad" />
        <FieldError message={officeErrors.radius_meters} />
        <Text style={styles.label}>Office status</Text>
        <ChoiceChips
          options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
          selected={[officeForm.is_active ? 'active' : 'inactive']}
          onPress={(v) => updateOffice('is_active', v === 'active')}
        />
        {officeNotice ? <InlineMessage message={officeNotice.message} tone={officeNotice.tone === 'success' ? 'success' : 'error'} /> : null}
        <ActionButton label="Save office details" onPress={() => void saveOfficeDetails()} loading={savingOffice} />
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F5EE' },
  content: { padding: 24, gap: 20, paddingBottom: 48 },
  center: { flex: 1, padding: 24, gap: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F5EE' },
  header: { gap: 6, paddingTop: 8 },
  eyebrow: { color: '#2F6B57', fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  title: { color: '#142A33', fontSize: 28, lineHeight: 34, fontWeight: '800' },
  subtitle: { color: '#5E6D73', fontSize: 15, lineHeight: 22 },
  section: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, gap: 14, borderWidth: 1, borderColor: '#E4E8E3' },
  sectionTitle: { color: '#143B4A', fontSize: 17, fontWeight: '800' },
  label: { color: '#29424B', fontSize: 13, fontWeight: '700' },
  readOnly: { color: '#5E6D73', fontSize: 15 },
  fieldError: { color: '#A34444', fontSize: 13, marginTop: -8 },
  locationPicker: { backgroundColor: '#F0F4F1', borderRadius: 14, padding: 16, gap: 10 },
  pickerTitle: { color: '#143B4A', fontSize: 15, fontWeight: '800' },
  pickerHint: { color: '#5E6D73', fontSize: 13, lineHeight: 18 },
  pickerButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#C9D6D9', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  pickerBtnPressed: { opacity: 0.7 },
  pickerBtnText: { color: '#143B4A', fontSize: 13, fontWeight: '700' },
  locationNotice: { color: '#2F6B57', fontSize: 13, lineHeight: 18 },
  coordPreview: { backgroundColor: '#DDF2E7', borderRadius: 12, padding: 14, gap: 6 },
  coordPreviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  coordPreviewText: { color: '#143B4A', fontSize: 15, fontWeight: '700' },
  coordPreviewHint: { color: '#2F6B57', fontSize: 12 },
});
