import { Txt } from '@toss/tds-react-native';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { theme } from '../theme';

interface HeartButtonProps {
  pressed: boolean;
  onPress: () => void;
  count: number;
}

export function HeartButton({ pressed, onPress, count }: HeartButtonProps) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPress}
        hitSlop={8}
        style={({ pressed: isPressed }) => [
          styles.button,
          isPressed && styles.pressed,
        ]}
        accessibilityLabel="공감"
        accessibilityRole="button"
      >
        <Txt
          typography="t5"
          color={pressed ? theme.heart : theme.heartInactive}
        >
          {pressed ? '♥' : '♡'}
        </Txt>
      </Pressable>
      <Txt typography="t7" color={theme.textSecondary}>
        {count}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  button: {
    padding: 4,
  },
  pressed: {
    opacity: 0.7,
  },
});
