import { Pressable, StyleSheet, Text, View } from 'react-native';

type ChoiceOption<T extends string | number> = { value: T; label: string };

export function ChoiceChips<T extends string | number>({ options, selected, onPress }: { options: ChoiceOption<T>[]; selected: T[]; onPress: (value: T) => void }) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const active = selected.includes(option.value);
        return (
          <Pressable
            key={String(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onPress(option.value)}
            style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#C9D6D9', backgroundColor: '#FFFFFF', justifyContent: 'center' },
  chipActive: { backgroundColor: '#143B4A', borderColor: '#143B4A' },
  pressed: { opacity: 0.7 },
  label: { color: '#29424B', fontSize: 14, fontWeight: '700' },
  labelActive: { color: '#FFFFFF' },
});
