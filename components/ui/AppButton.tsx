import { useThemeColor } from '@/hooks/useThemeColor';
import React from 'react';
import { StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import FSActivityLoader from './FSActivityLoader';

export type ButtonVariant = 'white' | 'dark' | 'coral' | 'outline';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export default function AppButton({
  title,
  onPress,
  variant = 'white',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const colorScheme = useThemeColor({}, 'text') === '#ECEDEE' ? 'dark' : 'light';

  const variantStyles = {
    white: {
      button: {
        backgroundColor: colorScheme === 'dark' ? '#2d2d2d' : '#fff',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      text: {
        color: colorScheme === 'dark' ? '#fff' : '#222',
      },
    },
    dark: {
      button: {
        backgroundColor: colorScheme === 'dark' ? '#151718' : '#222',
      },
      text: {
        color: colorScheme === 'dark' ? '#ECEDEE' : '#fff',
      },
    },
    coral: {
      button: {
        backgroundColor: '#FF6F6F',
      },
      text: {
        color: '#fff',
      },
    },
    outline: {
      button: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colorScheme === 'dark' ? '#fff' : '#222',
      },
      text: {
        color: colorScheme === 'dark' ? '#fff' : '#222',
      },
    },
  };

  const v = variantStyles[variant];
  return (
    <TouchableOpacity
      style={[
        styles.button,
        v.button,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled || loading}
    >
      {loading ? (
        <FSActivityLoader />
      ) : (
        <Text style={[styles.text, v.text, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    paddingVertical: 12, // reduced from 18
    borderRadius: 32,
    alignItems: 'center',
    marginVertical: 6, // reduced from 8
  },  text: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
