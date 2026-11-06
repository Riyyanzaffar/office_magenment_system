import { StyleSheet, Text, View } from 'react-native';

export function InlineMessage({ message, tone = 'error' }: { message: string; tone?: 'error' | 'info' | 'success' }) {
  return <View style={[styles.box, styles[tone]]}><Text style={styles.text}>{message}</Text></View>;
}

const styles = StyleSheet.create({
  box: { borderRadius: 12, padding: 13 },
  error: { backgroundColor: '#FBEAEA' },
  info: { backgroundColor: '#E8F1F3' },
  success: { backgroundColor: '#E4F4EA' },
  text: { color: '#29424B', fontSize: 14, lineHeight: 20 },
});
