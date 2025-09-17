import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { transactionService } from '@/services/apiService';

interface Transaction {
  id: string;
  transactionId: string;
  description?: string; // Make optional to match API
  amount: string | number;
  type: string;
  status?: 'completed' | 'failed' | 'pending' | 'refunded';
  createdAt: string;
  flow?: 'debit' | 'credit';
}

interface TransactionsListProps {
  transactions?: Transaction[]; // Make transactions optional
}

export default function TransactionsList({ transactions }: TransactionsListProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState<Transaction[] | null>(null);

  // Ensure transactions is an array and provide fallback
  const safeTransactions = transactions || [];

  // Fetch recent transactions on mount (limit 5)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await transactionService.getRecentTransactions({ limit: 5 });
        if (!mounted) return;
        if (res?.success && Array.isArray(res.data)) {
          setFetched(res.data);
        } else if (res?.success && (res as any).message && (res as any).data) {
          // In case API returns { success, message, data: [...] }
          const data = (res as any).data;
          if (Array.isArray(data)) setFetched(data);
        } else {
          setError(res?.message || res?.error || 'Failed to load transactions');
        }
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load transactions');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Sort transactions to prioritize pending ones
  const sourceTransactions = fetched ?? safeTransactions;
  const sortedTransactions = useMemo(() => {
    return [...sourceTransactions].sort((a, b) => {
    // Pending transactions first
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (b.status === 'pending' && a.status !== 'pending') return 1;
    
    // Then by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [sourceTransactions]);

  const handleTransactionPress = (transactionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/transactions/${transactionId}`);
  };

  // Helper function to format transaction description
  const getTransactionDescription = (transaction: Transaction) => {
    if (transaction.description) {
      return transaction.description;
    }
    
    // Fallback to formatted type if no description
    return transaction.type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Helper function to get status color
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return '#10B981'; // Green
      case 'failed':
        return '#EF4444'; // Red
      case 'pending':
        return '#F59E0B'; // Orange
      case 'refunded':
        return '#6366F1'; // Indigo
      default:
        return '#9CA3AF'; // Gray
    }
  };

  // Helper function to format status text
  const getStatusText = (status?: string) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Helper function to format transaction date
  const formatTransactionDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Helper function to determine if amount should be positive or negative
  const getAmountSign = (transaction: Transaction) => {
    // Refunds are always positive (money coming back to user)
    if (transaction.status === 'refunded') {
      return '+';
    }
    
    // Otherwise use the flow property
    return transaction.flow === 'credit' ? '+' : '-';
  };

  // Helper function to get amount color
  const getAmountColor = (transaction: Transaction) => {
    // Refunds are always green (positive)
    if (transaction.status === 'refunded') {
      return '#10B981';
    }
    
    // Otherwise use the flow property
    return transaction.flow === 'credit' ? '#10B981' : '#EF4444';
  };

  return (
    <View style={styles.section}>
      
      
      <View style={styles.transactionsContainer}>

        <View style={[styles.glassCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.95)' }]}>
      
          <View style={styles.transactionsList}>
          <View style={styles.sectionHeader}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Recent Transactions
        </ThemedText>        <TouchableOpacity style={styles.seeAllButton} onPress={()=>router.push("/transactions/")}>
          <ThemedText style={styles.seeAllText}>See All</ThemedText>
          <IconSymbol name="chevron.right" size={16} color={isDark ? Palette.white : "#3B82F6"} />
        </TouchableOpacity>
      </View>
            {loading && (
              <ThemedText style={{ opacity: 0.7, paddingVertical: 12 }}>Loading…</ThemedText>
            )}
            {!!error && !loading && (
              <ThemedText style={{ color: '#EF4444', paddingVertical: 12 }}>{error}</ThemedText>
            )}
            {!loading && !error && sortedTransactions.length === 0 && (
              <ThemedText style={{ opacity: 0.7, paddingVertical: 12 }}>No recent transactions</ThemedText>
            )}
            {sortedTransactions.slice(0, 5).map((transaction, index) => (
              <TouchableOpacity 
                key={transaction.id}
                style={[
                  styles.transactionItem,
                  index !== Math.min(sortedTransactions.length, 5) - 1 && styles.transactionItemBorder,
                  transaction.status === 'pending' && { position: 'relative' }
                ]}
                onPress={() => handleTransactionPress(transaction.id)}
              >
                {transaction.status === 'pending' && <View style={styles.pendingIndicator} />}
                <View style={styles.transactionLeft}>
                  <View style={styles.transactionInfo}>
                    <ThemedText style={styles.transactionTitle}>
                      {getTransactionDescription(transaction)}
                    </ThemedText>
                    <ThemedText style={styles.transactionDate}>
                      {formatTransactionDate(transaction.createdAt)} • {getStatusText(transaction.status)}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.transactionRight}>
                  <ThemedText 
                    style={[
                      styles.transactionAmount,
                      { color: getAmountColor(transaction) }
                    ]}
                  >
                    {getAmountSign(transaction)}₦{Number(transaction.amount).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </ThemedText>
                  <ThemedText style={[
                    styles.transactionStatus,
                    { color: getStatusColor(transaction.status) }
                  ]}>
                    {getStatusText(transaction.status)}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    // marginBottom: 36,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
   
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    
    letterSpacing: -0.5,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    // color: '#3B82F6',
    fontWeight: '600',
    fontSize: 16,
  },
  transactionsContainer: {
    borderRadius: 28,
    overflow: 'hidden',
  
  },
  glassCard: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  transactionsList: {
    padding: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  transactionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  transactionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    opacity: 0.6,
    fontWeight: '500',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
  transactionStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  pendingIndicator: {
    position: 'absolute',
    left: -8,
    top: '50%',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F59E0B',
    transform: [{ translateY: -2 }],
  },
});
