import { LinearGradient } from 'expo-linear-gradient';
import type { ColorValue } from 'react-native';
import { useColorScheme, ViewProps } from 'react-native';

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

  return (
    <LinearGradient
      colors={colors}
      style={[{ flex: 1}, style]}
      {...otherProps}
    >
      {children}
    </LinearGradient>
  );
}