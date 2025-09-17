import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { VirtualNumber, virtualNumberService } from '@/services/apiService';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function VirtualNumberScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const [virtualNumbers, setVirtualNumbers] = useState<VirtualNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVirtualNumbers();
  }, []);

  const fetchVirtualNumbers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await virtualNumberService.getPurchasedNumbers();
      
      if (response.success && response.data) {
        setVirtualNumbers(response.data);
      } else {
        setError('Failed to fetch virtual numbers');
      }
    } catch (err) {
      setError('Error fetching virtual numbers');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNumber = () => {
    // Navigate to buy virtual number page
   router.push("/virtual-numbers/product-list")
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'received':
        return '#4CAF50';
      case 'active':
        return '#2196F3';
      case 'expired':
        return '#FF9800';
      case 'pending':
        return '#FFC107';
      default:
        return isDark ? '#9BA1A6' : '#687076';
    }
  };

  const handleNumberPress = (virtualNumber: VirtualNumber) => {
    router.push(`/virtual-numbers/${virtualNumber.id}`);
  };

  const renderVirtualNumber = ({ item }: { item: VirtualNumber }) => (
    <TouchableOpacity 
      style={styles.numberCardContainer}
      onPress={() => handleNumberPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.numberCard, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}>
        <View style={styles.numberHeader}>
          <View style={styles.numberInfo}>
            <ThemedText style={styles.phoneNumber}>{item.phone}</ThemedText>
            <ThemedText style={styles.country}>{item.country.toUpperCase()}</ThemedText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <ThemedText style={styles.statusText}>{item.status}</ThemedText>
          </View>
        </View>
        
        <View style={styles.numberDetails}>
          <View style={styles.detailRow}>
            <IconSymbol name="receipt" size={16} color={isDark ? '#9BA1A6' : '#687076'} />
            <ThemedText style={styles.detailLabel}>Product:</ThemedText>
            <ThemedText style={styles.detailValue}>{item.product}</ThemedText>
          </View>
          
          <View style={styles.detailRow}>
            <IconSymbol name="schedule" size={16} color={isDark ? '#9BA1A6' : '#687076'} />
            <ThemedText style={styles.detailLabel}>Expires:</ThemedText>
            <ThemedText style={styles.detailValue}>{formatDate(item.expires)}</ThemedText>
          </View>
        </View>
        
        <View style={styles.tapIndicator}>
          <ThemedText style={styles.tapText}>Tap to view SMS</ThemedText>
          <IconSymbol name="chevron.right" size={16} color={isDark ? '#9BA1A6' : '#687076'} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <IconSymbol 
        name="phone" 
        size={80} 
        color={isDark ? '#4A4A4A' : '#E0E0E0'} 
        style={styles.emptyIcon}
      />
      <ThemedText style={styles.emptyTitle}>No Virtual Numbers</ThemedText>
      <ThemedText style={styles.emptyDescription}>
        You haven't purchased any virtual numbers yet. Get started by buying your first virtual number.
      </ThemedText>
      <AppButton
        title="Buy Virtual Number"
        onPress={handleBuyNumber}
        style={styles.buyButton}
      />
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <ThemedText style={styles.headerTitle}>Virtual Numbers</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            {virtualNumbers.length > 0 ? `${virtualNumbers.length} active number${virtualNumbers.length > 1 ? 's' : ''}` : 'Manage your virtual numbers'}
          </ThemedText>
        </View>
        
        {virtualNumbers.length > 0 && (
          <TouchableOpacity 
            style={[styles.buyButtonWithText, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]}
            onPress={handleBuyNumber}
          >
            <IconSymbol name="add" size={20} color={isDark ? '#FFF' : '#000'} />
            <ThemedText style={[styles.buyButtonText, { color: isDark ? '#FFF' : '#000' }]}>
              Buy Number
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <ThemedView style={styles.loadingContainer}>
          <ThemedText>Loading virtual numbers...</ThemedText>
        </ThemedView>
      ) : error ? (
        <ThemedView style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color="#FF6B6B" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <AppButton
            title="Retry"
            onPress={fetchVirtualNumbers}
            style={styles.retryButton}
          />
        </ThemedView>
      ) : virtualNumbers.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={virtualNumbers}
          renderItem={renderVirtualNumber}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
  },
  buyIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    // elevation: 2,
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
  },
  buyButtonWithText: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    textAlign: 'center',
    marginVertical: 16,
    fontSize: 16,
  },
  retryButton: {
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 24,
    marginBottom: 32,
  },
  buyButton: {
    paddingHorizontal: 32,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  numberCardContainer: {
    marginBottom: 16,
  },
  numberCard: {
    borderRadius: 16,
    padding: 16,
    // elevation: 2,
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
  },
  numberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  numberInfo: {
    flex: 1,
  },
  phoneNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  country: {
    fontSize: 14,
    opacity: 0.7,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  numberDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    opacity: 0.7,
    minWidth: 60,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  tapIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  tapText: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
  },
});
