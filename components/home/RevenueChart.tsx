import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';

interface ChartDataPoint {
  x: number;
  y: number;
}

interface ChartDataset {
  data: number[];
  color: (opacity?: number) => string;
  strokeWidth: number;
  label?: string;
}

interface RevenueChartProps {
  revenueData?: {
    labels: string[];
    datasets: ChartDataset[];
  };
}

// Generate realistic financial data with seasonal patterns and growth trends
const generateFinancialData = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  // Create data for the last 12 months
  const months = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(currentMonth - i);
    months.push({
      month: monthNames[date.getMonth()],
      monthIndex: 11 - i,
      year: date.getFullYear()
    });
  }
  
  // Generate revenue data with realistic patterns
  const baseRevenue = 25000;
  const revenueData = months.map((month, index) => {
    // Growth trend (3% monthly average)
    const growthFactor = 1 + (index * 0.03);
    
    // Seasonal variations (higher in Q4, lower in Q1)
    const seasonalMultiplier = month.month === 'Dec' ? 1.4 :
                              month.month === 'Nov' ? 1.3 :
                              month.month === 'Oct' ? 1.2 :
                              month.month === 'Jan' ? 0.8 :
                              month.month === 'Feb' ? 0.85 : 1.0;
    
    // Random variation ±15%
    const randomVariation = 0.85 + (Math.random() * 0.3);
    
    const revenue = Math.floor(baseRevenue * growthFactor * seasonalMultiplier * randomVariation);
    
    return revenue;
  });
  
  // Generate expenses data (typically 60-75% of revenue)
  const expensesData = revenueData.map((revenue) => {
    const expenseRatio = 0.65 + (Math.random() * 0.1); // 65-75%
    return Math.floor(revenue * expenseRatio);
  });
  
  // Generate profit data
  const profitData = revenueData.map((revenue, index) => revenue - expensesData[index]);
  
  return { 
    revenueData, 
    expensesData, 
    profitData, 
    monthLabels: months.map(m => m.month) 
  };
};

const chartTypes = ['Revenue', 'Profit', 'Expenses'] as const;
type ChartType = typeof chartTypes[number];

const { width } = Dimensions.get('window');

export default function RevenueChart({ revenueData }: RevenueChartProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [selectedChart, setSelectedChart] = useState<ChartType>('Revenue');
  const [chartData, setChartData] = useState<{
    revenueData: number[];
    expensesData: number[];
    profitData: number[];
    monthLabels: string[];
  }>({ revenueData: [], expensesData: [], profitData: [], monthLabels: [] });

  useEffect(() => {
    setChartData(generateFinancialData());
  }, []);

  const getCurrentData = (): number[] => {
    switch (selectedChart) {
      case 'Revenue':
        return chartData.revenueData;
      case 'Expenses':
        return chartData.expensesData;
      case 'Profit':
        return chartData.profitData;
      default:
        return chartData.revenueData;
    }
  };

  const getChartColor = () => {
    switch (selectedChart) {
      case 'Revenue':
        return '#3B82F6'; // Blue
      case 'Expenses':
        return '#EF4444'; // Red
      case 'Profit':
        return '#10B981'; // Green
      default:
        return '#3B82F6';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const calculateGrowth = () => {
    const data = getCurrentData();
    if (data.length < 2) return 0;
    
    const current = data[data.length - 1];
    const previous = data[data.length - 2];
    return ((current - previous) / previous) * 100;
  };

  const currentValue = getCurrentData().length > 0 ? getCurrentData()[getCurrentData().length - 1] : 0;
  const growthPercentage = calculateGrowth();

  // Create chart data in the format expected by react-native-chart-kit
  const chartDataFormatted = {
    labels: chartData.monthLabels,
    datasets: [
      {
        data: getCurrentData(),
        color: (opacity = 1) => getChartColor() + Math.floor(opacity * 255).toString(16).padStart(2, '0'),
        strokeWidth: 3
      }
    ]
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Financial Overview
          </ThemedText>
          <View style={styles.valueContainer}>
            <ThemedText style={styles.currentValue}>
              {formatCurrency(currentValue)}
            </ThemedText>
            <View style={[
              styles.growthBadge, 
              { backgroundColor: growthPercentage >= 0 ? '#10B981' : '#EF4444' }
            ]}>
              <ThemedText style={styles.growthText}>
                {growthPercentage >= 0 ? '+' : ''}{growthPercentage.toFixed(1)}%
              </ThemedText>
            </View>
          </View>
        </View>
        
        <View style={styles.chartSelector}>
          {chartTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.selectorButton,
                selectedChart === type && styles.selectorButtonActive,
                { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
              ]}
              onPress={() => {
                setSelectedChart(type);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <ThemedText style={[
                styles.selectorText,
                selectedChart === type && styles.selectorTextActive
              ]}>
                {type}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.chartContainer}>
        <View style={[
          styles.glassCard, 
          { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.95)' }
        ]}>
          <View style={styles.chartWrapper}>
            <LineChart
              data={chartDataFormatted}
              width={width - 80}
              height={260}
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: 'transparent',
                backgroundGradientTo: 'transparent',
                decimalPlaces: 0,
                color: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity * 0.6})` : `rgba(0, 0, 0, ${opacity * 0.6})`,
                style: { borderRadius: 0 },
                propsForDots: { 
                  r: "4",
                  strokeWidth: "2",
                  stroke: getChartColor()
                },
                propsForBackgroundLines: { 
                  strokeWidth: 1, 
                  stroke: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" 
                },
                fillShadowGradient: getChartColor(),
                fillShadowGradientOpacity: 0.1,
                formatYLabel: (value) => `$${(parseInt(value) / 1000).toFixed(0)}k`,
              }}
              bezier
              style={styles.chart}
              withInnerLines={true}
              withOuterLines={false}
              withVerticalLines={false}
              withHorizontalLines={true}
              segments={4}
              fromZero={false}
              withShadow={false}
              withDots={true}
              onDataPointClick={(data) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            />
          </View>
          
          {/* Chart legend */}
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: getChartColor() }]} />
              <ThemedText style={styles.legendText}>
                {selectedChart} (Last 12 months)
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
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  currentValue: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -1,
  },
  growthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  growthText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  chartSelector: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 2,
    gap: 4,
  },
  selectorButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  selectorButtonActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: '#3B82F6',
  },
  selectorText: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.6,
  },
  selectorTextActive: {
    opacity: 1,
    color: '#3B82F6',
    fontWeight: '600',
  },
  chartContainer: {
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
  },  chartWrapper: {
    padding: 20,
    alignItems: 'center',
  },
  chart: {
    borderRadius: 0,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
});
