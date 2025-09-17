import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';

export type CardActionsProps = {
  isFrozen?: boolean;
  onToggleFreeze?: () => void;
  onFund?: () => void;
  onWithdraw?: () => void;
  style?: StyleProp<ViewStyle>;
  size?: number; // diameter of circular button
};

type ActionButtonProps = {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  size: number;
  tint: string;
  bg: string;
};

function ActionButton({ label, iconName, onPress, size, tint, bg }: ActionButtonProps) {
  const iconSize = Math.round(size * 0.48);
  return (
    <View style={styles.actionContainer}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        activeOpacity={0.8}
        style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}
      >
        <Ionicons name={iconName} size={iconSize} color={tint} />
      </TouchableOpacity>
      <ThemedText style={styles.label}>{label}</ThemedText>
    </View>
  );
}

export default function CardActions({
  isFrozen = false,
  onToggleFreeze,
  onFund,
  onWithdraw,
  style,
  size = 64,
}: CardActionsProps) {
  const bg = useThemeColor({}, 'background');
  const icon = useThemeColor({}, 'icon');
  const tint = useThemeColor({}, 'tint');

  // Enhanced color scheme for light/dark modes
  const isDark = bg !== '#fff';
  const circleBg = isDark ? '#2A2A2A' : '#F8F9FA';
  const accent = tint ?? Colors.light.tint;
  
  // Optimized colors for different actions
  const freezeColor = isFrozen ? '#FF6B6B' : '#4ECDC4'; // Red when frozen, teal when active
  const fundColor = '#4CAF50'; // Green for funding
  const withdrawColor = '#FF9800'; // Orange for withdrawal

  return (
    <View style={[styles.row, style]}>
      <ActionButton
        label={isFrozen ? 'Unfreeze' : 'Freeze'}
        iconName={isFrozen ? 'snow-outline' : 'snow'}
        onPress={onToggleFreeze}
        size={size}
        tint={freezeColor}
        bg={circleBg}
      />
      <ActionButton
        label="Fund"
        iconName="add-circle-outline"
        onPress={onFund}
        size={size}
        tint={fundColor}
        bg={circleBg}
      />
      <ActionButton
        label="Withdraw"
        iconName="remove-circle-outline"
        onPress={onWithdraw}
        size={size}
        tint={withdrawColor}
        bg={circleBg}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // gap is supported in RN 0.79+, but we keep space-between for wider support
    paddingHorizontal: 4,
  },
  actionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  label: {
    marginTop: 8,
    fontSize: 12,
  },
});
