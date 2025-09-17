import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import DollarCardUI from '@/components/virtual cards/dollar/DollarCardUI';
import NairaCardUI from '@/components/virtual cards/naira/cardUI';
import PhysicalCardUI from '@/components/virtual cards/naira/PhysicalCardUI';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CardsIndex() {
  const { width, height } = useWindowDimensions();
  const scrollRef = useRef<ScrollView | null>(null);
  const [page, setPage] = useState(0);
  const [nairaView, setNairaView] = useState<'virtual' | 'physical'>('virtual');
  const router = useRouter();
  const params = useLocalSearchParams() as any;
  const iconColor = useThemeColor({}, 'text');

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const newPage = Math.round(x / width);
    if (newPage !== page) setPage(newPage);
  };

  const goToPage = (index: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ x: index * width, animated: true });
  };

  // Auto-scroll if target param is provided
  useEffect(() => {
    const target = (params?.target as string) || '';
    if (target.toLowerCase() === 'dollar') {
      // Dollar card is page index 1
      setTimeout(() => goToPage(1), 50);
    } else if (target.toLowerCase() === 'naira') {
      setTimeout(() => goToPage(0), 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.target, width]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
        <View style={styles.headerRow}>
            
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.backPressed]}>
            <Ionicons name="chevron-back" size={20} color={String(iconColor)} style={{ marginRight: 6 }} />
            <ThemedText style={styles.backLabel}>Back</ThemedText>
          </Pressable>

          <ThemedText style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
            {page === 0 ? (nairaView === 'virtual' ? 'Naira Virtual Card' : 'Naira Physical Card') : 'Dollar Card'}
          </ThemedText>

          <View style={styles.rightIndicator}>
            <Pressable onPress={() => goToPage(0)} style={styles.indicatorTouchable}>
              <View style={[styles.smallDot, page === 0 && styles.smallDotActive]} />
            </Pressable>
            <Pressable onPress={() => goToPage(1)} style={styles.indicatorTouchable}>
              <View style={[styles.smallDot, page === 1 && styles.smallDotActive]} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ height }}
      >
        <View style={[styles.page, { width, height }] }>
          {/* Naira segmented toggle */}
          <View style={styles.segmentedWrap}>
            <Pressable onPress={() => setNairaView('virtual')} style={[styles.segmentBtn, nairaView === 'virtual' && styles.segmentActive]}>
              <ThemedText style={[styles.segmentText, nairaView === 'virtual' && styles.segmentTextActive]}>Virtual</ThemedText>
            </Pressable>
            <Pressable onPress={() => setNairaView('physical')} style={[styles.segmentBtn, nairaView === 'physical' && styles.segmentActive]}>
              <ThemedText style={[styles.segmentText, nairaView === 'physical' && styles.segmentTextActive]}>Physical</ThemedText>
            </Pressable>
          </View>
          {nairaView === 'virtual' ? <NairaCardUI /> : <PhysicalCardUI />}
        </View>

        <View style={[styles.page, styles.altPage, { width, height }] }>
          <DollarCardUI />
        </View>
      </ScrollView>

      
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  page: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'transparent',
  },
  segmentedWrap: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB33',
    padding: 4,
    borderRadius: 10,
    marginBottom: 12,
  },
  segmentBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: '#111827',
  },
  segmentText: {
    fontWeight: '600',
    color: '#374151',
  },
  segmentTextActive: {
    color: '#fff',
  },
  altPage: {
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    maxWidth: 480,
  },
  headerSafeArea: {
    backgroundColor: 'transparent',
  },
  headerRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  backPressed: { opacity: 0.7 },
  backText: { fontSize: 20, marginRight: 6, fontWeight: '600' },
  backLabel: { fontSize: 14, opacity: 0.9 },
  headerTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center', flex: 1 },
  rightIndicator: { flexDirection: 'row', alignItems: 'center' },
  smallDot: { width: 8, height: 8, borderRadius: 8, backgroundColor: '#D1D5DB', marginHorizontal: 6 },
  smallDotActive: { backgroundColor: '#0EA5A4', width: 12, height: 8, borderRadius: 8 },
  indicatorWrap: {
    position: 'absolute',
    bottom: 28,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  indicatorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  indicatorTouchable: {
    padding: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 10,
    backgroundColor: '#D1D5DB',
  },
  dotActive: {
    backgroundColor: '#0EA5A4',
    width: 18,
  },
});
