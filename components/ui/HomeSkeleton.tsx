import { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const { width } = Dimensions.get('window');

// Basic skeleton item component with shimmer animation
const SkeletonItem = ({ width: itemWidth, height, borderRadius = 8, style }: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, []);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });
  
  return (
    <Animated.View
      style={[
        {
          width: itemWidth,
          height,
          borderRadius,
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          opacity: shimmerOpacity,
        },
        style,
      ]}
    />
  );
};

// Skeleton loader for home screen
export default function HomeSkeleton() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  return (
    <View style={[styles.container, { backgroundColor: isDark ? Palette.black : '#F5F5F5' }]}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <SkeletonItem width={40} height={40} borderRadius={20} />
          <View style={styles.headerText}>
            <SkeletonItem width={100} height={16} />
            <SkeletonItem width={80} height={12} style={{ marginTop: 4 }} />
          </View>
        </View>
        <SkeletonItem width={40} height={40} borderRadius={20} />
      </View>

      {/* Balance Card Skeleton */}
      <View style={[styles.balanceCard, { backgroundColor: isDark ? Palette.lighterBlack : Palette.white }]}>
        <SkeletonItem width={120} height={16} style={{ alignSelf: 'center' }} />
        <SkeletonItem width={200} height={32} style={{ alignSelf: 'center', marginTop: 12 }} />
        <View style={styles.balanceButtons}>
          <SkeletonItem width={80} height={32} borderRadius={16} />
          <SkeletonItem width={80} height={32} borderRadius={16} />
        </View>
      </View>

      {/* Quick Actions Skeleton */}
      <View style={[styles.quickActions, { backgroundColor: isDark ? Palette.lighterBlack : Palette.white }]}>
        <SkeletonItem width={100} height={18} style={{ marginBottom: 16 }} />
        <View style={styles.actionsGrid}>
          {[1, 2, 3, 4].map((item) => (
            <View key={item} style={styles.actionItem}>
              <SkeletonItem width={48} height={48} borderRadius={24} />
              <SkeletonItem width={60} height={12} style={{ marginTop: 8 }} />
            </View>
          ))}
        </View>
      </View>

      {/* Weekly Summary Skeleton */}
      <View style={[styles.weeklySummary, { backgroundColor: isDark ? Palette.lighterBlack : Palette.white }]}>
        <SkeletonItem width={120} height={18} style={{ marginBottom: 16 }} />
        <View style={styles.summaryGrid}>
          {[1, 2, 3, 4].map((item) => (
            <View key={item} style={styles.summaryItem}>
              <SkeletonItem width={40} height={16} />
              <SkeletonItem width={60} height={12} style={{ marginTop: 4 }} />
            </View>
          ))}
        </View>
      </View>

      {/* Chart Skeleton */}
      <View style={[styles.chart, { backgroundColor: isDark ? Palette.lighterBlack : Palette.white }]}>
        <SkeletonItem width={140} height={18} style={{ marginBottom: 16 }} />
        <SkeletonItem width="100%" height={200} borderRadius={12} />
      </View>

      {/* Transactions List Skeleton */}
      <View style={[styles.transactions, { backgroundColor: isDark ? Palette.lighterBlack : Palette.white }]}>
        <View style={styles.transactionsHeader}>
          <SkeletonItem width={120} height={18} />
          <SkeletonItem width={60} height={14} />
        </View>
        {[1, 2, 3, 4].map((item) => (
          <View key={item} style={styles.transactionItem}>
            <SkeletonItem width={40} height={40} borderRadius={20} />
            <View style={styles.transactionContent}>
              <SkeletonItem width={100} height={16} />
              <SkeletonItem width={80} height={12} style={{ marginTop: 4 }} />
            </View>
            <View style={styles.transactionAmount}>
              <SkeletonItem width={60} height={16} />
              <SkeletonItem width={40} height={12} style={{ marginTop: 4 }} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
  },
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  balanceButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  quickActions: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionItem: {
    alignItems: 'center',
    flex: 1,
  },
  weeklySummary: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  chart: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  transactions: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  transactionContent: {
    flex: 1,
    marginLeft: 12,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
});
