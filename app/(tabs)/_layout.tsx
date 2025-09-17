import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useNotificationPolling } from '@/hooks/useNotificationPolling';
import { useAppStore } from '@/store';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { unreadNotificationCount, hasInitiallyFetched } = useAppStore();
  
  // Start notification polling
  useNotificationPolling();

  function CustomTabBarIcon({ name, focused }: { name: string; focused: boolean }) {
    const backgroundColor = focused ? '#000000' : 'transparent';
    const iconColor = focused ? '#FFFFFF' : (isDark ? '#9BA1A6' : '#687076');
    const isNotification = name === 'bell';
    
    return (
      <View style={[styles.iconContainer, { backgroundColor }]}>
        <IconSymbol
          size={30}
          name={name as any}
          color={iconColor}
        />
        {isNotification && unreadNotificationCount > 0 && hasInitiallyFetched && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount.toString()}
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tabIconSelected,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        headerShown: false,
        // tabBarBackground: TabBarBackground,
        tabBarStyle: [
          {
            borderTopWidth: 0,
            backgroundColor: isDark ? '#1B1B1B' : '#F5F5F5',
            height: 80,
            paddingBottom: 5,
            paddingTop: 10,
            elevation: 0, // Remove shadow on Android
            shadowOpacity: 0, // Remove shadow on iOS
          },
          Platform.select({ ios: { position: 'absolute' }, default: {} }),
        ],
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => <CustomTabBarIcon name="dollar" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="utilities"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => <CustomTabBarIcon name="donut-small" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="cards"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => <CustomTabBarIcon name="credit-card" focused={focused} />, // Use a card/credit-card icon
        }}
      />
      <Tabs.Screen
        name="virtual-number"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => <CustomTabBarIcon name="phone" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="crypto"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => <CustomTabBarIcon name="bitcoin" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
