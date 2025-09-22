import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import type { ColorValue } from 'react-native';
import { Text, useColorScheme, ViewProps } from 'react-native';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  children?: React.ReactNode;
};

const lightGradient: [ColorValue, ColorValue] = ['#f5f5f5', '#e3e3e3'];
const darkGradient: [ColorValue, ColorValue] = ['#2D2D2D', '#1B1B1B'];

export function ThemedView({ style, children, ...otherProps }: ThemedViewProps) {
  const colorScheme = useColorScheme();
  const colors: [ColorValue, ColorValue] = colorScheme === 'dark' ? darkGradient : lightGradient;

  // React Native requires strings to be wrapped in <Text>. Some screens might
  // accidentally pass whitespace/newline strings as children. Normalize here.
  const normalizedChildren = React.Children.toArray(children).flatMap((child, idx) => {
    if (typeof child === 'string') {
      const trimmed = child.trim();
      if (trimmed.length === 0) return [];
      return <Text key={`themedview-text-${idx}`}>{trimmed}</Text>;
    }
    return child as any;
  });

  return (
    <LinearGradient
      colors={colors}
      style={[{ flex: 1}, style]}
      {...otherProps}
    >
      {normalizedChildren}
    </LinearGradient>
  );
}