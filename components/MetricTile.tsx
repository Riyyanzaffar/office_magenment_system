import { LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

type MetricTileProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  accent: 'navy' | 'green' | 'gold' | 'warning';
  subtitle?: string;
};

const accentColors = {
  navy: { bg: '#143B4A', text: '#FFFFFF', icon: '#DDF2E7' },
  green: { bg: '#2F6B57', text: '#FFFFFF', icon: '#DDF2E7' },
  gold: { bg: '#8A6D12', text: '#FFFFFF', icon: '#F8EBD2' },
  warning: { bg: '#A86A1C', text: '#FFFFFF', icon: '#F8EBD2' },
} as const;

export function MetricTile({ label, value, icon: Icon, accent, subtitle }: MetricTileProps) {
  const colors = accentColors[accent];
  return (
    <View style={[styles.tile, { backgroundColor: colors.bg }]}>
      <View style={styles.tileTop}>
        <View style={styles.iconWrap}>
          <Icon color={colors.icon} size={18} strokeWidth={2} />
        </View>
        <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      </View>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.text, opacity: 0.8 }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { flexGrow: 1, flexBasis: 160, minWidth: 160, borderRadius: 18, padding: 16, gap: 8 },
  tileTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  value: { fontSize: 32, lineHeight: 38, fontWeight: '800' },
  label: { fontSize: 13, fontWeight: '700' },
  subtitle: { fontSize: 11, lineHeight: 16 },
});
