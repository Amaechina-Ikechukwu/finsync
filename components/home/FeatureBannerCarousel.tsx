import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Href } from 'expo-router';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Slide = {
  key: string;
  title: string;
  subtitle: string;
  gradient: [string, string];
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  onPress: () => void;
  accessibilityLabel: string;
};

const DECORATION = () => (
  <View style={styles.patternOverlay} pointerEvents="none">
    <Svg width="100%" height="100%">
      <Line x1="0" y1="30" x2="100%" y2="0" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
      <Line x1="0" y1="80" x2="100%" y2="50" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
      <Line x1="0" y1="130" x2="100%" y2="100" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />

      <Circle cx="85%" cy="20%" r="50" fill="rgba(255,255,255,0.08)" />
      <Circle cx="15%" cy="85%" r="35" fill="rgba(255,255,255,0.06)" />
      <Circle cx="70%" cy="75%" r="20" fill="rgba(255,255,255,0.05)" />
    </Svg>
  </View>
);

export default function FeatureBannerCarousel() {
  const slides: Slide[] = useMemo(
    () => [
      {
        key: 'social-growth',
        title: 'Social growth',
        subtitle: 'Grow together with friends',
        gradient: ['#0ba360', '#3cba92'],
        icon: 'account-group',
  onPress: () => router.push('/sizzle' as Href),
        accessibilityLabel: 'Explore social growth',
      },
      {
        key: 'dollar-card',
        title: 'Dollar card',
        subtitle: 'Spend globally with ease',
        gradient: ['#005C97', '#363795'],
        icon: 'credit-card-outline',
  onPress: () => router.push('/cards' as Href),
        accessibilityLabel: 'Explore dollar card',
      },
      {
        key: 'crypto',
        title: 'Crypto',
        subtitle: 'Buy, sell, and track',
        gradient: ['#F7971E', '#FFD200'],
        icon: 'currency-btc',
        onPress: () => router.push('/crypto/native' as Href),
        accessibilityLabel: 'Explore crypto',
      },
    ],
    []
  );

  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  // Auto-advance every 4 seconds
  useEffect(() => {
    const id = setInterval(() => {
      const next = (index + 1) % slides.length;
      setIndex(next);
      scrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
    }, 4000);
    return () => clearInterval(id);
  }, [index, slides.length]);

  const onMomentumScrollEnd = (e: any) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (newIndex !== index) setIndex(newIndex);
  };

  return (
    <View style={styles.carouselContainer}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
      >
        {slides.map((s) => (
          <View key={s.key} style={{ width: SCREEN_WIDTH }}>
            <Pressable
              style={styles.pressable}
              accessibilityRole="button"
              accessibilityLabel={s.accessibilityLabel}
              onPress={s.onPress}
            >
              <LinearGradient
                colors={s.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.banner}
              >
                <DECORATION />
                <View style={styles.contentRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{s.title}</Text>
                    <Text style={styles.subtitle}>{s.subtitle}</Text>
                  </View>
                  <View style={styles.rightCol}>
                    <View style={styles.iconCircle}>
                      <MaterialCommunityIcons name={s.icon} size={30} color="#fff" />
                    </View>
                    <View style={styles.ctaButton}>
                      <Text style={styles.ctaText}>Explore</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dotsContainer}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  carouselContainer: {
    marginTop: 10,
    marginBottom: 6,
  },
  pressable: {
    marginHorizontal: 16,
  },
  banner: {
    borderRadius: 20,
    padding: 22,
    minHeight: 140,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rightCol: {
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
  },
  ctaButton: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  ctaText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 6,
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  dotActive: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    width: 10,
    borderRadius: 5,
  },
});
