import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface UtilityService {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}

export default function Utilities() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const cardBg = isDark ? '#2D2D2D' : Palette.white;
  const iconColor = isDark ? Palette.white : Palette.black;
  const borderColor = isDark ? Palette.white : Palette.black;
  const textColor = isDark ? Palette.white : Palette.black;

  const services: UtilityService[] = [    {
      id: 'airtime',
      title: 'Buy Airtime',
      description: 'Top up your mobile phone',
      icon: 'phone',      
      onPress: () => router.push('/vtu'),
    },{
      id: 'data',
      title: 'Buy Data',
      description: 'Purchase internet data bundles',
      icon: 'wifi',
      onPress: () => router.push('/vtu/buy-data'),
    },    {
      id: 'electricity',
      title: 'Pay Electricity',
      description: 'Pay your electricity bills',
      icon: 'flash',
      onPress: () => router.push('/vtu/buy-electricity'),
    },{
      id: 'betting',
      title: 'Fund Betting Account',
      description: 'Add money to your betting wallet',
      icon: 'sports',
      onPress: () => router.push('/vtu/fund-betting'),
    },    {
      id: 'cable',
      title: 'Cable/TV Subscription',
      description: 'Pay for your TV subscriptions',
      icon: 'tv',
      onPress: () => router.push('/vtu/buy-cable'),
    },
    {
      id: 'sizzle',
      title: 'Social Media Growth',
      description: 'Buy social media accounts and growth services',
      icon: 'add-reaction',
      onPress: () => router.push('/sizzle'),
    },
    // {
    //   id: 'insurance',
    //   title: 'Insurance Premium',
    //   description: 'Pay your insurance premiums',
    //   icon: 'security',
    //   onPress: () => {},
    // },
  ];

  const UtilityCard = ({ service }: { service: UtilityService }) => (
    <TouchableOpacity
      style={[
        styles.card,        {
          backgroundColor: cardBg,
          borderColor: borderColor + '20',
        },
      ]}
      onPress={service.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <IconSymbol
            name={service.icon as any}
            size={24}
            color={iconColor}
          />
        </View>
        <View style={styles.textContainer}>
          <ThemedText type="defaultSemiBold" style={styles.serviceTitle}>
            {service.title}
          </ThemedText>
          <ThemedText style={styles.serviceDescription}>
            {service.description}
          </ThemedText>
        </View>
        <View style={styles.chevronContainer}>
          <IconSymbol
            name="chevron.right"
            size={20}
            color={iconColor}
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>
            Utilities
          </ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Pay bills and manage your services
          </ThemedText>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {services.map((service) => (
            <UtilityCard key={service.id} service={service} />
          ))}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: {
    marginBottom: 5,
  },
  headerSubtitle: {
    opacity: 0.7,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },  card: {
    borderRadius: 16,
    marginBottom: 12,
    
    // shadowColor: Palette.black,
    // shadowOffset: {
    //   width: 0,
    //   height: 0,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 8,
    // elevation: 30,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(148, 148, 148, 0.1)', // Using Palette.black with opacity
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 17,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  chevronContainer: {
    padding: 4,
  },
});