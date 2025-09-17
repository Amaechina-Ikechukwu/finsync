import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SMSMessage, VirtualNumber, virtualNumberService } from '@/services/apiService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';

interface VirtualNumberDetails extends VirtualNumber {}

interface SMSResponse {
  success: boolean;
  data: {
    sms: SMSMessage[];
  };
}

export default function VirtualNumberDetailsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [smsMessages, setSmsMessages] = useState<SMSMessage[]>([]);
  const [virtualNumber, setVirtualNumber] = useState<VirtualNumberDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchSMSMessages();
    }
  }, [id]);

  const fetchSMSMessages = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const response = await virtualNumberService.getSMSMessages(id);
      
      if (response.success && response.data) {
        setSmsMessages(response.data.data.sms);
        // Note: virtualNumber is not returned in the new API response
        // setVirtualNumber(response.data.virtualNumber);
      } else {
        setError('Failed to fetch SMS messages');
      }
    } catch (err) {
      setError('Error fetching SMS messages');
      console.error('Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchSMSMessages(true);
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
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

  const renderSMSMessage = ({ item }: { item: SMSMessage }) => (
    <ThemedView style={[styles.messageCard, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}>
      <View style={styles.messageHeader}>
        <View style={styles.senderInfo}>
          <ThemedText style={styles.senderName}>{item.sender}</ThemedText>
          <ThemedText style={styles.messageTime}>{formatTime(item.date)}</ThemedText>
        </View>
        <ThemedText style={styles.messageDate}>{formatDate(item.date)}</ThemedText>
      </View>
      
      <ThemedText style={styles.messageText}>{item.text}</ThemedText>
    </ThemedView>
  );

  const renderHeader = () => (
    <ThemedView style={[styles.headerCard, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}>
      <View style={styles.numberHeader}>
        <View style={styles.numberInfo}>
          <ThemedText style={styles.phoneNumber}>{virtualNumber?.phone}</ThemedText>
          <ThemedText style={styles.country}>{virtualNumber?.country.toUpperCase()}</ThemedText>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(virtualNumber?.status || '') }]}>
          <ThemedText style={styles.statusText}>{virtualNumber?.status}</ThemedText>
        </View>
      </View>
      
      <View style={styles.numberDetails}>
        <View style={styles.detailRow}>
          <IconSymbol name="receipt" size={16} color={isDark ? '#9BA1A6' : '#687076'} />
          <ThemedText style={styles.detailLabel}>Product:</ThemedText>
          <ThemedText style={styles.detailValue}>{virtualNumber?.product}</ThemedText>
        </View>
        
        <View style={styles.detailRow}>
          <IconSymbol name="schedule" size={16} color={isDark ? '#9BA1A6' : '#687076'} />
          <ThemedText style={styles.detailLabel}>Expires:</ThemedText>
          <ThemedText style={styles.detailValue}>{virtualNumber?.expires ? formatDate(virtualNumber.expires) : 'N/A'}</ThemedText>
        </View>
      </View>
    </ThemedView>
  );

  const renderEmptyState = () => (
    <ThemedView style={styles.emptyContainer}>
      <IconSymbol 
        name="send" 
        size={80} 
        color={isDark ? '#4A4A4A' : '#E0E0E0'} 
        style={styles.emptyIcon}
      />
      <ThemedText style={styles.emptyTitle}>No SMS Messages</ThemedText>
      <ThemedText style={styles.emptyDescription}>
        No SMS messages have been received for this virtual number yet. Messages will appear here when they arrive.
      </ThemedText>
      <AppButton
        title="Refresh"
        onPress={handleRefresh}
        style={styles.refreshButton}
      />
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color={isDark ? '#FFF' : '#000'} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <ThemedText style={styles.headerTitle}>Virtual Number</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            {smsMessages.length > 0 ? `${smsMessages.length} message${smsMessages.length > 1 ? 's' : ''}` : `Number: ${id}`}
          </ThemedText>
        </View>
        
        <TouchableOpacity 
          style={styles.refreshIconButton}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <IconSymbol 
            name="add" 
            size={20} 
            color={isDark ? '#FFF' : '#000'} 
            style={refreshing ? { opacity: 0.5 } : {}}
          />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <ThemedView style={styles.loadingContainer}>
          <ThemedText>Loading SMS messages...</ThemedText>
        </ThemedView>
      ) : error ? (
        <ThemedView style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color="#FF6B6B" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <AppButton
            title="Retry"
            onPress={() => fetchSMSMessages()}
            style={styles.retryButton}
          />
        </ThemedView>
      ) : (
        <FlatList
          data={smsMessages}
          renderItem={renderSMSMessage}
          keyExtractor={(item, index) => `${item.date}-${item.sender}-${index}`}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={isDark ? '#FFF' : '#000'}
            />
          }
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
  refreshIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    fontSize: 20,
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
    marginTop: 100,
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
  refreshButton: {
    paddingHorizontal: 32,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  messageCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  senderInfo: {
    flex: 1,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  messageTime: {
    fontSize: 12,
    opacity: 0.6,
  },
  messageDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
