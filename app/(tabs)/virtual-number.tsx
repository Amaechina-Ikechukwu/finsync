import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


const { height } = Dimensions.get('window');

const CARD_OPTIONS = [
   {
    key: 'esims',
    label: 'eSIMs',
    iconSymbol: 'wifi',
    // lighter teal gradient to suggest connectivity
    gradient: ['#f8fafc', '#e2e8f0', '#f8fafc'],
  },
  {
    key: 'virtual-numbers',
    label: 'Virtual Numbers',
    iconSymbol: 'phone',
    // subtle dark blue gradient
    gradient: ['#0F172A', '#0B233A', '#0F172A'],
  },
 
];

import { LinearGradient } from 'expo-linear-gradient';

function MovingGradient({ colors, children }) {
  // Use a static gradient (no animation)
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    >
      {children}
    </LinearGradient>
  );
}

export default function CardScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.splitContainer}>
        {CARD_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={styles.halfButton}
            activeOpacity={0.85}
            onPress={() => {
              if (option.key === 'virtual-numbers') {
                router.push('/virtual-numbers');
              } else if (option.key === 'esims') {
                // No dedicated eSIM route exists yet — reuse product list with a type query.
                router.push('/esim');
              }
            }}
          >
            <MovingGradient colors={option.gradient}>
              <View style={styles.gradientContent}>
                <IconSymbol
                  name={option.iconSymbol as any}
                  size={64}
                  color={option.key === 'esims' ? '#232526' : '#fff'}
                  style={styles.icon}
                />
                <Text style={option.key === 'esims' ? [styles.buttonText, styles.buttonTextDark] : styles.buttonText}>{option.label}</Text>
              </View>
            </MovingGradient>
          </TouchableOpacity>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    margin: 0,
  },
  splitContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  halfButton: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  giftCardContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    gap: 16,
    paddingVertical: 24,
  },
  giftCardButtonsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  giftCardButton: {
    backgroundColor: '#232526',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 120,
    alignItems: 'center',
  },
  giftCardButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#232526',
  },
  giftCardButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  giftCardButtonTextSecondary: {
    color: '#232526',
  },
  gradientContent: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    gap: 16,
  },
  icon: {
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  buttonTextDark: {
    color: '#232526',
    textShadowColor: 'rgba(255,255,255,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  seeCardsButton: {
    marginTop: 12,
    alignSelf: 'center',
    backgroundColor: '#232526',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  seeCardsButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
