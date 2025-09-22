import { Palette } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../ThemedText';

interface KeypadProps {
  // Controlled value and change handler
  value: string;
  onChange: (newValue: string) => void;
  onSubmit?: (value: string) => void; // fired when desired length reached (optional)
  maxLength?: number; // default 4
  onLongDelete?: () => void; // clear all
  // Extras
  showBiometric?: boolean;
  onBiometricPress?: () => void;
  showPinDots?: boolean; // Control whether to show PIN dots
}

const keys = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  [null, '0', 'del'],
];

export default function Keypad({ 
  value,
  onChange,
  onSubmit,
  maxLength = 4,
  onLongDelete,
  showBiometric,
  onBiometricPress,
  showPinDots = true,
}: KeypadProps) {
  const bgColor = useThemeColor({}, 'background');
  const keyBgColor = useThemeColor({ light: '#F3F3F3', dark: Palette.grayDark }, 'background');
  const keyTextColor = useThemeColor({}, 'text');

  const currentPin = value ?? '';

  const handleKeyPress = (key: string) => {
    if (key === 'del') {
      if (currentPin.length > 0) {
        onChange(currentPin.slice(0, -1));
      }
    } else if (currentPin.length < maxLength) {
      const newVal = currentPin + key;
      onChange(newVal);
      if (newVal.length === maxLength && onSubmit) {
        onSubmit(newVal);
      }
    }
  };

  const handleLongDelete = () => {
    if (onLongDelete) onLongDelete();
    else if (currentPin.length > 0) onChange('');
  };

  return (
    <View style={[styles.container]}>
      {/* PIN dots display - only show when not used by AppLock */}
    {showPinDots && (
        <View style={styles.pinContainer}>
      {Array.from({ length: maxLength }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.pinDot,
                { backgroundColor: index < currentPin.length ? keyTextColor : 'transparent' },
                { borderColor: keyTextColor }
              ]}
            />
          ))}
        </View>
      )}

      {/* Keypad */}
      {keys.map((row, i) => (
        <View style={styles.row} key={i}>
          {row.map((key, index) => (
            key ? (
              <TouchableOpacity
                key={key}
                style={[styles.key, { backgroundColor: keyBgColor }]}
                onPress={() => handleKeyPress(key)}
                onLongPress={key === 'del' ? handleLongDelete : undefined}
                activeOpacity={0.7}>
                <ThemedText style={[styles.keyText, { color: keyTextColor }]}>
                  {key === 'del' ? '⌫' : key}
                </ThemedText>
              </TouchableOpacity>
            ) : showBiometric && onBiometricPress ? (
              // Show biometric button in the null position (bottom-left)
              <TouchableOpacity
                key={`biometric-${index}`}
                style={[styles.key, { backgroundColor: keyBgColor }]}
                onPress={() => {
                  onBiometricPress();
                }}
                activeOpacity={0.7}>
                <Ionicons 
                  name="finger-print" 
                  size={24} 
                  color={keyTextColor} 
                />
              </TouchableOpacity>
            ) : (
              <View key={`empty-${index}`} style={styles.key} />
            )
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf:'center'
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
    gap: 16,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  key: {
    width: 64,
    height: 64,
    margin: 8,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#404040',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 1 },
    elevation: 10, // for Android
  },
  keyText: {
    fontSize: 24,
    textAlign:"center"
  },
});
