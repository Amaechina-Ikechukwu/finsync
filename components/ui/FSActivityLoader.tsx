import { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import React from 'react';
import { ActivityIndicator, StyleSheet, View, ViewStyle } from 'react-native';

interface FSActivityLoaderProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
  variant?: 'spinner' | 'pulse' | 'dots' | 'wave' | 'bars';
  thickness?: number;
}

export default function FSActivityLoader({ 
  size = 44, 
  color, 
  style, 
  variant = 'spinner',
  thickness = 3
}: FSActivityLoaderProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
           <ActivityIndicator 
             size="large" 
             color={colorScheme === 'dark' ? Palette.white : Palette.black} 
           />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  spinner: {
    borderStyle: 'solid',
  },
  pulse: {
    // No additional styles needed
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    // No additional styles needed
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  waveBar: {
    // No additional styles needed
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: '100%',
  },
  bar: {
    // No additional styles needed
  },
});