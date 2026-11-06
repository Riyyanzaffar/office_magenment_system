import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

export function ActionButton({ label, onPress, variant = 'primary', loading = false, disabled = false }: { label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'danger'; loading?: boolean; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [styles.button, styles[variant], (pressed || disabled || loading) && styles.muted]}>
      {loading ? <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : '#143B4A'} /> : <Text style={[styles.text, variant === 'secondary' && styles.secondaryText]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 18 },
  primary: { backgroundColor: '#143B4A' },
  secondary: { backgroundColor: '#DDF2E7' },
  danger: { backgroundColor: '#A34444' },
  muted: { opacity: 0.55 },
  text: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  secondaryText: { color: '#143B4A' },
});
