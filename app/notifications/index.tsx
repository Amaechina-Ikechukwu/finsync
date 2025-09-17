import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Palette } from '@/constants/Colors';
import { Notification } from '@/services/apiService';
import { useAppStore } from '@/store';
import { router } from 'expo-router';
import { FlatList, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';

import FSActivityLoader from '@/components/ui/FSActivityLoader';
import React, { useEffect } from 'react';

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();

  const { 
    unreadNotificationCount, 
    notifications, 
    markAllNotificationsRead, 
    fetchNotifications,
    fetchUnreadNotificationCount,
    isNotificationsLoading 
  } = useAppStore();
  
  useEffect(() => {
    fetchNotifications();
    fetchUnreadNotificationCount();
  }, []);

  // Separate effect to mark notifications as read when entering the page
  useEffect(() => {
    const markNotificationsAsRead = async () => {
      if (unreadNotificationCount > 0) {
        await markAllNotificationsRead();
        await fetchUnreadNotificationCount();
      }
    };
    
    // Only mark as read if we have unread notifications and they're loaded
    if (unreadNotificationCount > 0 && notifications.length > 0) {
      markNotificationsAsRead();
    }
  }, [unreadNotificationCount, notifications.length]);


  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleNotificationPress = (notification: Notification) => {
    
    // Navigate to transactions page
    router.push(`/transactions/${notification.data?.transactionId}`);
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => {
    // All notifications can navigate to transactions page
    const canNavigate = true;
    
    return (
      <TouchableOpacity 
        style={[
          styles.notificationItem, 
          !item.isRead && styles.unreadItem,
          { 
            backgroundColor: colorScheme === 'dark' ? Palette.grayDark : Palette.white,
          }
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <ThemedText style={styles.notificationTitle}>{item.title}</ThemedText>
        <ThemedText style={styles.notificationBody}>{item.body}</ThemedText>
        <View style={styles.notificationFooter}>
          <ThemedText style={styles.notificationTime}>{formatDate(item.createdAt)}</ThemedText>
          <ThemedText style={[styles.tapHint, ]}>
            Tap to view transactions
          </ThemedText>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <ThemedView style={styles.emptyState}>
      <ThemedText style={styles.emptyStateText}>No notifications yet</ThemedText>
    </ThemedView>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <IconSymbol name="chevron.left" size={22} color={colorScheme === 'dark' ? Palette.white : Palette.text} />
        </TouchableOpacity>
        <ThemedText style={styles.title}>Notifications</ThemedText>
      </View>
      {unreadNotificationCount > 0 && (
        <TouchableOpacity 
          style={[styles.markAllButton, { backgroundColor: colorScheme === 'dark' ? '#333' : '#f0f0f0' }]}
          onPress={async () => {
            await markAllNotificationsRead();
            await fetchUnreadNotificationCount();
          }}
        >
          <ThemedText style={styles.markAllButtonText}>Mark All Read</ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderLoadingSpinner = () => (
    <ThemedView style={styles.loadingContainer}>
      <FSActivityLoader
      />
      <ThemedText style={styles.loadingText}>Loading notifications...</ThemedText>
    </ThemedView>
  );
  
  return (
    <ThemedView style={styles.container}>
      {isNotificationsLoading ? (
        renderLoadingSpinner()
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={[
            styles.flatListContent,
            notifications.length === 0 && styles.emptyContentContainer
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  flatListContent: {
    padding: 20,
  },
  emptyContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  headerContainer: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    // alignItems: 'center',
    // justifyContent:"flex-start",
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    // justifyContent: 'center',
    // alignItems: 'center',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 20,
  },
  notificationItem: {
    padding: 15,

    marginBottom: 10,
    borderRadius: 8,

  },
  unreadItem: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderColor: 'rgba(74, 144, 226, 0.3)',
  },
  notificationTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    fontSize: 16,
  },
  notificationBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    opacity: 0.5,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  tapHint: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    opacity: 0.6,
  },
  markAllButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  markAllButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7,
  },
});
