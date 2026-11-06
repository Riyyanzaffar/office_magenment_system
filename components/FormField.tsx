import { Text, TextInput, TextInputProps, StyleSheet, View } from 'react-native';

export function FormField({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor="#8A989D" style={styles.input} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 7 },
  label: { color: '#29424B', fontSize: 13, fontWeight: '700' },
  input: { minHeight: 52, borderWidth: 1, borderColor: '#D5DEE1', borderRadius: 14, backgroundColor: '#FFFFFF', paddingHorizontal: 16, color: '#142A33', fontSize: 16 },
});
