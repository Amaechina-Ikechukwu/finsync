import { Picker } from '@react-native-picker/picker';
import React from 'react';
import { ActionSheetIOS, Platform, Text, TouchableOpacity } from 'react-native';

type Item = { label: string; value: string };

type Props = {
  selectedValue: string | number;
  onValueChange: (value: any) => void;
  items: Item[];
  style?: any;
  textColor?: string;
  enabled?: boolean;
};

/**
 * Small cross-platform picker: on iOS shows an ActionSheetIOS list,
 * on Android (and others) renders the native Picker.
 */
export default function CrossPlatformPicker({ selectedValue, onValueChange, items, style, textColor, enabled = true }: Props) {
  if (Platform.OS === 'ios') {
    // Use stringified comparison to be tolerant of number/string differences
    const selected = items.find((it) => String(it.value) === String(selectedValue));
    const label = selected ? selected.label : (items[0]?.label ?? 'Select');

    const open = () => {
      if (!enabled) return;
      const optionLabels = items.map((it) => it.label ?? String(it.value));
      const values = items.map((it) => it.value);
      optionLabels.push('Cancel');
      const cancelIndex = optionLabels.length - 1;
      ActionSheetIOS.showActionSheetWithOptions({ options: optionLabels, cancelButtonIndex: cancelIndex }, (buttonIndex) => {
        if (buttonIndex === cancelIndex) return;
        const val = values[buttonIndex];
        onValueChange?.(val);
      });
    };

    return (
      <TouchableOpacity
        onPress={open}
        style={[{ justifyContent: 'center', height: 44, paddingHorizontal: 12 }, style]}
        disabled={!enabled}
        accessibilityState={{ disabled: !enabled }}
      >
        <Text style={{ color: textColor }}>{label}</Text>
      </TouchableOpacity>
    );
  }

  // Android / other - render native Picker
  return (
    <Picker
      selectedValue={selectedValue}
      onValueChange={(val: any) => onValueChange?.(val)}
      style={style}
      enabled={enabled}
      dropdownIconColor={textColor}
    >
      {items.map((it) => (
        <Picker.Item key={String(it.value)} label={it.label} value={it.value} />
      ))}
    </Picker>
  );
}
