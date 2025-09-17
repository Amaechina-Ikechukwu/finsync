import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { BarChart, LineChart, PieChart, ProgressChart } from 'react-native-chart-kit';

import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';

const { width } = Dimensions.get('window');

// Generate realistic financial data
const generateChartData = () => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  
  // Expense categories data for pie chart
  const expenseCategories = [
    { name: 'Food & Dining', amount: 1250, color: '#FF6B6B', legendFontColor: '#333', legendFontSize: 14 },
    { name: 'Transportation', amount: 890, color: '#4ECDC4', legendFontColor: '#333', legendFontSize: 14 },
    { name: 'Shopping', amount: 750, color: '#45B7D1', legendFontColor: '#333', legendFontSize: 14 },
    { name: 'Entertainment', amount: 480, color: '#F9CA24', legendFontColor: '#333', legendFontSize: 14 },
    { name: 'Bills & Utilities', amount: 920, color: '#6C5CE7', legendFontColor: '#333', legendFontSize: 14 },
  ];

  // Monthly savings data for bar chart
  const savingsData = {
    labels: monthNames,
    datasets: [
      {
        data: [2200, 2800, 1900, 3100, 2650, 3400],
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
        strokeWidth: 2
      }
    ]
  };

  // Budget progress data
  const budgetProgress = {
    labels: ['Food', 'Transport', 'Bills', 'Entertainment'],
    data: [0.7, 0.4, 0.9, 0.3]
  };

  // Cash flow comparison
  const cashFlowData = {
    labels: monthNames,
    datasets: [
      {
        data: [5200, 5800, 4900, 6100, 5650, 6400],
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 3,
        label: 'Income'
      },
      {
        data: [4290, 4950, 3760, 4820, 4280, 5120],
        color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
        strokeWidth: 3,
        label: 'Expenses'
      }
    ]
  };

  return { expenseCategories, savingsData, budgetProgress, cashFlowData };
};

export default function FinancialCharts() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [selectedTab, setSelectedTab] = useState<'overview' | 'expenses' | 'savings' | 'budget'>('overview');
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    setChartData(generateChartData());
  }, []);

  if (!chartData) {
    return (
      <View style={styles.container}>
        <ThemedText>Loading charts...</ThemedText>
      </View>
    );
  }

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    decimalPlaces: 0,
    color: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity * 0.6})` : `rgba(0, 0, 0, ${opacity * 0.6})`,
    style: { borderRadius: 0 },
    propsForBackgroundLines: { 
      strokeWidth: 1, 
      stroke: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" 
    },
  };

  const renderOverviewChart = () => (
    <View style={styles.chartSection}>
      <ThemedText style={styles.chartTitle}>Cash Flow Overview</ThemedText>
      <View style={styles.chartContainer}>
        <LineChart
          data={chartData.cashFlowData}
          width={width - 60}
          height={240}
          chartConfig={{
            ...chartConfig,
            formatYLabel: (value) => `$${(parseInt(value) / 1000).toFixed(1)}k`,
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
    </View>
  );

  const renderExpensesChart = () => (
    <View style={styles.chartSection}>
      <ThemedText style={styles.chartTitle}>Expense Breakdown</ThemedText>
      <View style={styles.chartContainer}>
        <PieChart
          data={chartData.expenseCategories}
          width={width - 60}
          height={240}
          chartConfig={chartConfig}
          accessor="amount"
          backgroundColor="transparent"
          paddingLeft="15"
          center={[10, 10]}
          style={styles.chart}
        />
      </View>
    </View>
  );

  const renderSavingsChart = () => (
    <View style={styles.chartSection}>
      <ThemedText style={styles.chartTitle}>Monthly Savings</ThemedText>
      <View style={styles.chartContainer}>
        <BarChart
          data={chartData.savingsData}
          width={width - 60}
          height={240}
          yAxisLabel="$"
          yAxisSuffix="k"
          chartConfig={{
            ...chartConfig,
            formatYLabel: (value) => `$${(parseInt(value) / 1000).toFixed(1)}k`,
          }}
          style={styles.chart}
          showValuesOnTopOfBars={true}
          withInnerLines={false}
        />
      </View>
    </View>
  );

  const renderBudgetChart = () => (
    <View style={styles.chartSection}>
      <ThemedText style={styles.chartTitle}>Budget Progress</ThemedText>
      <View style={styles.chartContainer}>
        <ProgressChart
          data={chartData.budgetProgress}
          width={width - 60}
          height={240}
          chartConfig={{
            ...chartConfig,
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
          }}
          hideLegend={false}
          style={styles.chart}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScrollView}>
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'expenses', label: 'Expenses' },
            { key: 'savings', label: 'Savings' },
            { key: 'budget', label: 'Budget' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                selectedTab === tab.key && styles.activeTab,
                { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
              ]}
              onPress={() => {
                setSelectedTab(tab.key as any);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <ThemedText style={[
                styles.tabText,
                selectedTab === tab.key && styles.activeTabText
              ]}>
                {tab.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.content}>
        {selectedTab === 'overview' && renderOverviewChart()}
        {selectedTab === 'expenses' && renderExpensesChart()}
        {selectedTab === 'savings' && renderSavingsChart()}
        {selectedTab === 'budget' && renderBudgetChart()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 36,
  },
  tabContainer: {
    marginBottom: 20,
  },
  tabScrollView: {
    flexGrow: 0,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  activeTab: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.6,
  },
  activeTabText: {
    opacity: 1,
    color: '#3B82F6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  chartSection: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  chartContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    alignItems: 'center',
  },
  chart: {
    borderRadius: 0,
  },
});
