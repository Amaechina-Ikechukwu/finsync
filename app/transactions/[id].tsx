import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import FSActivityLoader from '@/components/ui/FSActivityLoader';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Transaction, transactionService } from '@/services/apiService';

export default function TransactionDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
    const fetchTransaction = async () => {
      if (!id) {
        return;
      }
      
    
      try {
        setLoading(true);
        setError(null);
        
        const response = await transactionService.getTransactionById(id);
        
        if (response.success && response.data) {
          setTransaction(response.data);
        } else {
          setError(response.error || 'Failed to fetch transaction details');
        }
      } catch (err) {
        setError('An error occurred while fetching transaction details');
        console.error('Error fetching transaction:', err);
      } finally {
        setLoading(false);
      }
    };
  useEffect(() => {


     fetchTransaction();
  }, [id]);

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const getStatusColor = (status?: string) => {
    if (!status) return isDark ? Palette.white : Palette.text;
    
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'failed':
        return '#EF4444';
      case 'pending':
        return '#F59E0B';
      default:
        return isDark ? Palette.white : Palette.text;
    }
  };

  const getAmountColor = (flow?: string) => {
    if (flow === 'credit') return '#10B981';
    if (flow === 'debit') return '#EF4444';
    return isDark ? Palette.white : Palette.text;
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString || 'N/A';
    }
  };

  const formatAmount = (amount: string, currency: string = 'NGN') => {
    try {
      const numAmount = parseFloat(amount || '0');
      return `${currency === 'NGN' ? '₦' : currency} ${numAmount.toLocaleString()}`;
    } catch {
      return `${currency === 'NGN' ? '₦' : currency} 0`;
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={isDark ? Palette.white : Palette.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>
            Transaction Details
          </ThemedText>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <FSActivityLoader />
          <ThemedText style={styles.loadingText}>Loading transaction details...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error || !transaction) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={isDark ? Palette.white : Palette.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>
            Transaction Details
          </ThemedText>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color="#EF4444" />
          <ThemedText style={styles.errorText}>
            {'Transaction not found'}
          </ThemedText>
      
          <AppButton onPress={handleGoBack} title='Go Back'  />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={isDark ? Palette.white : Palette.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>
          Transaction Details
        </ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Section */}
        <View style={[styles.section, styles.statusSection]}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(transaction.status || 'pending') + '20' }
          ]}>
            <ThemedText style={[styles.statusText, { color: getStatusColor(transaction.status || 'pending') }]}>
              {transaction.status ? transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1) : 'Pending'}
            </ThemedText>
          </View>
        </View>

        {/* Amount Section */}
        <View style={[styles.section, styles.amountSection]}>
          <ThemedText style={styles.amountLabel}>Amount</ThemedText>
          <ThemedText style={[styles.amountValue, { color: getAmountColor(transaction.flow) }]}>
            {transaction.flow === 'credit' ? '+' : transaction.flow === 'debit' ? '-' : ''}
            {formatAmount(transaction.amount, transaction.currency)}
          </ThemedText>
        </View>

        {/* Transaction Details */}
        <View style={[styles.section, styles.detailsSection]}>
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Transaction ID</ThemedText>
            <ThemedText style={styles.detailValue}>{transaction.transactionId || 'N/A'}</ThemedText>
          </View>

          {transaction.reference && (
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Reference</ThemedText>
              <ThemedText style={styles.detailValue}>{transaction.reference}</ThemedText>
            </View>
          )}

          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Type</ThemedText>
            <ThemedText style={styles.detailValue}>
              {transaction.type ? transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1) : 'N/A'}
            </ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Description</ThemedText>
            <ThemedText style={styles.detailValue}>{transaction.description || 'No description'}</ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Date & Time</ThemedText>
            <ThemedText style={styles.detailValue}>{formatDate(transaction.createdAt)}</ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Currency</ThemedText>
            <ThemedText style={styles.detailValue}>{transaction.currency || 'NGN'}</ThemedText>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.7,
  },
  errorButton: {
    backgroundColor: Palette.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: Palette.white,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  amountLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  detailsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  metadataSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    opacity: 0.7,
    flex: 1,
    marginRight: 16,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  bottomSpacing: {
    height: 40,
  },
});