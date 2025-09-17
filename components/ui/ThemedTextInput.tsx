import { useThemeColor } from '@/hooks/useThemeColor';
import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';

export type ThemedTextInputProps = TextInputProps & {
  style?: any;
  lightColor?: string;
  darkColor?: string;
};

export function ThemedTextInput({ style, lightColor, darkColor, ...rest }: ThemedTextInputProps) {
  const backgroundColor = useThemeColor({ light: '#f0f0f0', dark: '#1C1C1C' }, 'background');
  const color = useThemeColor({ light: '#000', dark: '#fff' }, 'text');

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <TextInput
        style={[styles.input, { color }]}
        placeholderTextColor={useThemeColor({ light: '#888', dark: '#aaa' }, 'text')}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 8,
    width: '100%',
  },
  input: {
    fontSize: 16,
    fontFamily: 'Belgrano-Regular',
  },
});
