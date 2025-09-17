import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import FSActivityLoader from '@/components/ui/FSActivityLoader';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { Transaction, TransactionListParams, transactionService } from '@/services/apiService';

interface TransactionPagination {
  limit: number;
  offset: number;
  total: number;
}

export default function TransactionsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { showAlert, showError } = useCustomAlert();

  // State management
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState<TransactionPagination>({
    limit: 20,
    offset: 0,
    total: 0,
  });
  const [filters, setFilters] = useState<TransactionListParams>({
    limit: 20,
    offset: 0,
  });

  // Fetch transactions
  const fetchTransactions = useCallback(async (isRefresh = false, isLoadMore = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const params = isRefresh 
        ? { ...filters, offset: 0 }
        : isLoadMore 
        ? { ...filters, offset: pagination.offset + pagination.limit }
        : filters;

      const response = await transactionService.getTransactions(params);
      
      if (response.success && response.data) {
        const responseData = response.data;
        const newTransactions = responseData.data || [];
        const newPagination = responseData.pagination;
        
        if (isRefresh) {
          setTransactions(newTransactions);
        } else if (isLoadMore) {
          setTransactions(prev => [...prev, ...newTransactions]);
        } else {
          setTransactions(newTransactions);
        }
        
        if (newPagination) {
          setPagination(newPagination);
        }
      } else {
        showError('Error', response.error || 'Failed to fetch transactions');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showError('Error', 'Failed to fetch transactions. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [filters, pagination.offset, pagination.limit, showAlert]);

  // Initial load
  useEffect(() => {
    fetchTransactions();
  }, []);

  // Handle transaction press
  const handleTransactionPress = (transactionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/transactions/${transactionId}` as any);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchTransactions(true);
  };

  // Handle load more
  const handleLoadMore = () => {
    const canLoadMore = pagination.offset + pagination.limit < pagination.total;
    if (!loadingMore && canLoadMore) {
      fetchTransactions(false, true);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString || 'N/A';
    }
  };

  // Format amount
  const formatAmount = (amount: string, flow: string) => {
    try {
      const numAmount = typeof amount === 'string' ? parseFloat(amount || '0') : Number(amount || 0);
      const sign = flow === 'credit' ? '+' : '-';
      return `${sign}₦${Math.abs(numAmount).toFixed(2)}`;
    } catch {
      const sign = flow === 'credit' ? '+' : '-';
      return `${sign}₦0.00`;
    }
  };

  // Get status color
  const getStatusColor = (status?: string) => {
    if (!status) return isDark ? Palette.white : Palette.text;
    
    switch (status.toLowerCase()) {
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

  // Get transaction icon
  const getTransactionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'airtime':
        return 'phone';
      case 'data':
        return 'wifi';
      case 'cable':
        return 'tv';
      case 'electricity':
        return 'flash';
      case 'betting':
        return 'sports';
      case 'transfer':
        return 'send';
      default:
        return 'receipt';
    }
  };

  // Render transaction item
  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={[
        styles.transactionItem,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.95)',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        },
      ]}
      onPress={() => handleTransactionPress(item.transactionId)}
    >
      <View style={styles.transactionLeft}>
        <View
          style={[
            styles.transactionIconContainer,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(59,130,246,0.1)',
            },
          ]}
        >
          <IconSymbol
            name={getTransactionIcon(item.type)}
            size={20}
            color={isDark ? Palette.white : '#3B82F6'}
          />
        </View>
        <View style={styles.transactionInfo}>
          <ThemedText style={styles.transactionTitle}>
            {item.description || item.type.toUpperCase()}
          </ThemedText>
          <ThemedText style={styles.transactionDate}>
            {formatDate(item.createdAt)}
          </ThemedText>
          <ThemedText style={styles.transactionType}>
            {item.type} 
          </ThemedText>
        </View>
      </View>
      <View style={styles.transactionRight}>
        <ThemedText
          style={[
            styles.transactionAmount,
            { color: (item.flow || 'debit') === 'credit' ? '#10B981' : '#EF4444' },
          ]}
        >
          {formatAmount(item.amount, item.flow || 'debit')}
        </ThemedText>
        <ThemedText
          style={[
            styles.transactionStatus,
            { color: getStatusColor(item.status || 'pending') },
          ]}
        >
          {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Pending'}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  // Render loading more indicator
  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <FSActivityLoader />
        <ThemedText style={styles.loadingMoreText}>Loading more transactions...</ThemedText>
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <IconSymbol
        name="doc.text.fill"
        size={64}
        color={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
      />
      <ThemedText style={styles.emptyStateTitle}>No Transactions Found</ThemedText>
      <ThemedText style={styles.emptyStateSubtitle}>
        Your transaction history will appear here once you start using FinSync services.
      </ThemedText>
      <AppButton
        title="Refresh"
        onPress={handleRefresh}
        variant="white"
        style={styles.refreshButton}
      />
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => router.back()}
              style={styles.backButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <IconSymbol name="chevron.left" size={24} color={isDark ? Palette.white : Palette.text} />
            </TouchableOpacity>
            <ThemedText type="title" style={styles.title}>
              Transactions
            </ThemedText>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <FSActivityLoader />
          <ThemedText style={styles.loadingText}>Loading transactions...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <IconSymbol name="chevron.left" size={24} color={isDark ? Palette.white : Palette.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>
            Transactions
          </ThemedText>
        </View>
        <ThemedText style={styles.totalCount}>
          {pagination.total} transaction{pagination.total !== 1 ? 's' : ''}
        </ThemedText>
      </View>

      <FlatList
        data={transactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          transactions.length === 0 && styles.emptyContainer,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3B82F6']}
            tintColor={isDark ? Palette.white : '#3B82F6'}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalCount: {
    fontSize: 16,
    opacity: 0.6,
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 14,
    opacity: 0.6,
    fontWeight: '500',
    marginBottom: 2,
  },
  transactionType: {
    fontSize: 12,
    opacity: 0.5,
    fontWeight: '500',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  transactionStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  separator: {
    height: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    opacity: 0.6,
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
    opacity: 0.6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  refreshButton: {
    paddingHorizontal: 32,
  },
});
