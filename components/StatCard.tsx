import { LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

type StatCardProps = {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone?: 'navy' | 'green' | 'warning';
};

export function StatCard({ label, value, hint, icon: Icon, tone = 'navy' }: StatCardProps) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, styles[tone]]}>
        <Icon color={toneIconColor[tone]} size={20} strokeWidth={2} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.hint}>{hint}</Text>
    </View>
  );
}

const toneIconColor = { navy: '#143B4A', green: '#2F6B57', warning: '#8A5A12' } as const;

const styles = StyleSheet.create({
  card: { flexGrow: 1, flexBasis: 150, minWidth: 150, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, gap: 4, borderWidth: 1, borderColor: '#E4E8E3' },
  iconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  navy: { backgroundColor: '#E3EBEE' },
  green: { backgroundColor: '#DDF2E7' },
  warning: { backgroundColor: '#F8EBD2' },
  value: { color: '#142A33', fontSize: 28, lineHeight: 34, fontWeight: '800' },
  label: { color: '#29424B', fontSize: 14, fontWeight: '700' },
  hint: { color: '#5E6D73', fontSize: 12, lineHeight: 17 },
});
