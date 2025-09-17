import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface Service {
  id: number;
  title: string;
  icon: any;
  gradient?: [string, string];
  color?: string; // Support legacy color format
}

interface QuickActionsProps {
  services?: Service[]; // Make services optional
}

const { width } = Dimensions.get('window');

// Default services with gradient colors
const defaultServices: Service[] = [
  {
    id: 1,
    title: 'Buy Airtime',
    icon: 'call',
    gradient: ['#FF6B6B', '#FF8E53'],
  },
  {
    id: 2,
    title: 'Buy Data',
    icon: 'wifi',
    gradient: ['#4ECDC4', '#44A08D'],
  },
  {
    id: 3,
    title: 'Social Growth',
    icon: 'trending-up',
    gradient: ['#667eea', '#764ba2'],
  },
  {
    id: 4,
    title: 'More',
    icon: 'ellipsis-horizontal',
    gradient: ['#D299C2', '#9A4A80'],
  },
];

export default function QuickActions({ services }: QuickActionsProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  // Navigation handler
  const handleServicePress = (service: Service) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    switch (service.title) {
      case 'Buy Airtime':
        router.push('/vtu');
        break;
      case 'Buy Data':
        router.push('/vtu/buy-data');
        break;
      case 'Social Growth':
        router.push('/sizzle');
        break;
      case 'More':
        router.push('/(tabs)/utilities');
        break;
      default:
        // For custom services, you might want to add a route property to the Service interface
    }
  };

  // Use provided services or fallback to default services with additional safety checks
  const safeServices = React.useMemo(() => {
    if (Array.isArray(services) && services.length > 0) {
      // Convert services with color property to gradient format
      return services.map(service => ({
        ...service,
        gradient: service.gradient || [service.color || '#666666', service.color || '#888888'] as [string, string]
      }));
    }
    return defaultServices;
  }, [services]);

  return (
    <View style={styles.section}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>
        Quick Actions
      </ThemedText>
      <View style={styles.servicesGrid}>
        {safeServices && safeServices.length > 0 ? (
          safeServices.map((service, index) => (
            <TouchableOpacity
              key={service.id}
              onPress={() => handleServicePress(service)}
              style={styles.cardWrapper}
            >
              <LinearGradient
                colors={isDark ? [
                  `${service.gradient?.[0]}15` || '#66666615',
                  `${service.gradient?.[1]}25` || '#88888825',
                  'rgba(255,255,255,0.02)'
                ] : [
                  `${service.gradient?.[0]}08` || '#66666608',
                  `${service.gradient?.[1]}12` || '#88888812',
                  'rgba(255,255,255,0.95)'
                ]}
                style={[
                  styles.serviceCard,
                  {
                    borderColor: isDark 
                      ? `${service.gradient?.[0]}30` || 'rgba(255,255,255,0.1)'
                      : `${service.gradient?.[0]}20` || 'rgba(0,0,0,0.08)',
                    backgroundColor: isDark ? 'transparent' : 'rgba(255,255,255,0.9)',
                  }
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View
                  style={[
                    styles.serviceIcon,
                    { 
                      backgroundColor: service.gradient?.[0] || '#666666',
                      shadowColor: service.gradient?.[0] || '#666666',
                      shadowOpacity: isDark ? 0.4 : 0.3,
                      shadowOffset: { width: 0, height: isDark ? 6 : 4 },
                      shadowRadius: isDark ? 12 : 8,
                      elevation: isDark ? 8 : 6,
                    }
                  ]}
                >
                  <Ionicons 
                    name={service.icon as any} 
                    size={28} 
                    color={Palette.white} 
                  />
                </View>
                
                <ThemedText style={styles.serviceTitle}>
                  {service.title}
                </ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          ))
        ) : (
          <ThemedText style={styles.noServicesText}>
            No services available
          </ThemedText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    marginBottom: 36,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  cardWrapper: {
    width: (width - 56) / 2,
  },
  serviceCard: {
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1.5,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 12 },
    // shadowOpacity: 0.06,
    // shadowRadius: 24,
    // elevation: 8,
    // Glass morphism effect
    backdropFilter: 'blur(40px)',
    overflow: 'hidden',
  },
  serviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  serviceSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  noServicesText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.6,
    fontStyle: 'italic',
  },
});
