import { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function AuthShell({ title, subtitle, children, footer }: PropsWithChildren<{ title: string; subtitle: string; footer?: ReactNode }>) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brandMark}><Text style={styles.brandMarkText}>SA</Text></View>
          <Text style={styles.eyebrow}>SMART ATTENDANCE</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <View style={styles.form}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F8FA' },
  keyboard: { flex: 1 },
  content: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  brandMark: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#143B4A', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  brandMarkText: { color: '#B9E5D0', fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  eyebrow: { color: '#4E7B78', fontSize: 12, fontWeight: '700', letterSpacing: 2, marginBottom: 10 },
  title: { color: '#142A33', fontSize: 34, lineHeight: 40, fontWeight: '800', marginBottom: 10 },
  subtitle: { color: '#5E6D73', fontSize: 16, lineHeight: 24, marginBottom: 28 },
  form: { gap: 14 },
  footer: { marginTop: 24, alignItems: 'center' },
});
