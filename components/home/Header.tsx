import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAppStore } from '@/store';
import { router } from 'expo-router';

interface UserData {
  // From user profile API (/accounts/me)
  email: string;
  fullname: string;
  phone: string;
  hasAppCode: boolean;
  hasTransactionPin: boolean;
  hasAccountNumber: boolean;
  
  // From account details API (/accounts/details)
  account_number: string;
  account_status: string;
  amount: number;
  bank_name: string;
  
  // UI/App specific fields (not from API)
  avatar: string;
  routingNumber: string;
  currency: string;
}

interface AvatarData {
  initials: string;
  gradientColors: [string, string];
}

interface HeaderProps {
  userData: UserData;
  avatarData: AvatarData;
  onAvatarPress: () => void;
}

export default function Header({ userData, avatarData, onAvatarPress }: HeaderProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { unreadNotificationCount } = useAppStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <ThemedText type="title" style={styles.greeting}>
          {getGreeting()}
        </ThemedText>
        <ThemedText type="default" style={styles.userName}>
          {userData.fullname}
        </ThemedText>
      </View>
      <View style={styles.headerRight}>
      
        <TouchableOpacity onPress={onAvatarPress}>
          <View style={[styles.avatarContainer, { backgroundColor: isDark ? Palette.black : Palette.white }]}>
            <ThemedText style={styles.avatarText}>
              {avatarData.initials}
            </ThemedText>
          </View>
        </TouchableOpacity>
          <TouchableOpacity
          accessibilityRole="button"
          onPress={() => router.push('/notifications')}
          style={[styles.notifButton]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <IconSymbol name="notifications" size={22} color={isDark ? Palette.white : Palette.text} />
          {unreadNotificationCount > 0 && <View style={styles.badgeDot} />}
        </TouchableOpacity>
      </View>
      
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  userName: {
    fontSize: 18,
    opacity: 0.7,
    marginTop: 4,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notifButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#fff',
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    // shadowOffset: { width: 0, height: 0 },
    // shadowOpacity: 0.3,
    // shadowRadius: 8,
    // elevation: 20,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
  },
});
