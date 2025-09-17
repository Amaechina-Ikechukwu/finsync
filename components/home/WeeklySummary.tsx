import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';

interface WeeklyStatsData {
  totalRides: number;
  grossIncome: number;
  platformFee: number;
  netEarnings: number;
}

interface WeeklySummaryProps {
  weeklyStats: WeeklyStatsData;
}

export default function WeeklySummary({ weeklyStats }: WeeklySummaryProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.section}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        Weekly Summary
      </ThemedText>
      <View style={styles.summaryContainer}>
        <View style={[styles.glassCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.95)' }]}>
          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Total rides</ThemedText>
              <ThemedText style={styles.summaryValue}>{weeklyStats.totalRides}</ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Gross Income</ThemedText>
              <ThemedText style={[styles.summaryValue, { color: '#10B981' }]}>
                ${weeklyStats.grossIncome.toLocaleString()}
              </ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText style={styles.summaryLabel}>Platform Fee</ThemedText>
              <ThemedText style={[styles.summaryValue, { color: '#EF4444' }]}>
                ${weeklyStats.platformFee.toLocaleString()}
              </ThemedText>
            </View>
            <View style={[styles.summaryRow, styles.summaryRowLast]}>
              <ThemedText style={[styles.summaryLabel, { fontWeight: '700' }]}>Net Earnings</ThemedText>
              <ThemedText style={[styles.summaryValue, { fontWeight: '800', color: '#3B82F6', fontSize: 20 }]}>
                ${weeklyStats.netEarnings.toLocaleString()}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    marginBottom: 36,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  summaryContainer: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  glassCard: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  summaryContent: {
    padding: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  summaryRowLast: {
    borderBottomWidth: 0,
    paddingTop: 20,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: 'rgba(59, 130, 246, 0.2)',
  },
  summaryLabel: {
    fontSize: 16,
    opacity: 0.8,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
  },
});
