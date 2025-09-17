import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React from 'react';
import { Animated, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useNotification } from '../InAppNotificationProvider';

interface Beneficiary {
  id: string;
  name: string;
  phone?: string;
  network?: string;
  customerId?: string;
  serviceId?: string;
  meterNumber?: string;
  variationId?: string;
  accountNumber?: string;
  bankName?: string;
  bankCode?: string;
  serviceType: 'vtu' | 'betting' | 'cable' | 'electricity' | 'transfer';
  dateAdded: string;
}

interface SavedBeneficiariesProps {
  beneficiaries: Beneficiary[];
  onBeneficiaryPress?: (beneficiary: Beneficiary) => void;
}

// Separate component for each beneficiary item to properly use hooks
const BeneficiaryItem = ({ 
  item, 
  isDark, 
  getServiceIcon, 
  getServiceColor, 
  getDisplayText, 
  onPress 
}: {
  item: Beneficiary;
  isDark: boolean;
  getServiceIcon: (type: string) => keyof typeof MaterialIcons.glyphMap;
  getServiceColor: (type: string) => string;
  getDisplayText: (beneficiary: Beneficiary) => string;
  onPress: (beneficiary: Beneficiary) => void;
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 5,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 5,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.beneficiaryCard}
        onPress={() => onPress(item)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        <View style={[
          styles.iconContainer, 
          { 
            backgroundColor: getServiceColor(item.serviceType) + '15', // More transparent for glassy effect
            borderColor: getServiceColor(item.serviceType) + '30',
            borderWidth: 1,
          }
        ]}>
          <MaterialIcons
            name={getServiceIcon(item.serviceType)}
            size={24}
            color={getServiceColor(item.serviceType)}
          />
        </View>
        <View style={styles.beneficiaryInfo}>
          <ThemedText style={styles.beneficiaryName} numberOfLines={1}>
            {item.name}
          </ThemedText>
          <ThemedText style={styles.beneficiaryDetails} numberOfLines={1}>
            {getDisplayText(item)}
          </ThemedText>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function SavedBeneficiaries({ beneficiaries, onBeneficiaryPress }: SavedBeneficiariesProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const {  showNotification,  } = useNotification();

  if (!beneficiaries || beneficiaries.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>
            Saved Beneficiaries
          </ThemedText>
          <ThemedText style={[styles.count, { color: isDark ? Palette.white : Palette.grayDark }]}>
            0
          </ThemedText>
        </View>
        
        <View style={[
          styles.card, 
          { 
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : Palette.white,
            shadowColor: isDark ? '#000' : '#000',
          }
        ]}>
          <View style={styles.emptyState}>
            <MaterialIcons 
              name="person-add" 
              size={40} 
              color={isDark ? Palette.gray : Palette.grayDark} 
            />
            <ThemedText style={[styles.emptyText, { color: isDark ? Palette.gray : Palette.grayDark }]}>
              No saved beneficiaries yet
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: isDark ? Palette.gray : Palette.grayDark }]}>
              Make a transaction to save beneficiaries
            </ThemedText>
          </View>
        </View>
        
     
      </View>
    );
  }

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'vtu':
        return 'smartphone' as keyof typeof MaterialIcons.glyphMap;
      case 'betting':
        return 'flash-on' as keyof typeof MaterialIcons.glyphMap; // Lightning icon like in image
      case 'cable':
        return 'tv' as keyof typeof MaterialIcons.glyphMap;
      case 'electricity':
        return 'flash-on' as keyof typeof MaterialIcons.glyphMap;
      case 'transfer':
        return 'account-balance' as keyof typeof MaterialIcons.glyphMap; // Bank icon like in image
      default:
        return 'person' as keyof typeof MaterialIcons.glyphMap;
    }
  };

  const getServiceColor = (serviceType: string) => {
    switch (serviceType) {
      case 'vtu':
        return '#8B5CF6'; // Purple like in the image
      case 'betting':
        return '#EF4444'; // Red like in the image
      case 'cable':
        return '#8B5CF6'; // Purple
      case 'electricity':
        return '#EF4444'; // Red
      case 'transfer':
        return '#06B6D4'; // Cyan like in the image
      default:
        return '#3B82F6'; // Blue
    }
  };

  const getDisplayText = (beneficiary: Beneficiary) => {
    switch (beneficiary.serviceType) {
      case 'vtu':
        return beneficiary.network || 'Mobile';
      case 'betting':
        return 'Betting';
      case 'cable':
        return 'Cable TV';
      case 'electricity':
        return 'Electricity';
      case 'transfer':
        return beneficiary.bankName || 'Bank Transfer';
      default:
        return 'Service';
    }
  };

  const handleBeneficiaryPress = (beneficiary: Beneficiary) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      // Navigate to appropriate page with beneficiary data
      switch (beneficiary.serviceType) {
        case 'vtu':
          showNotification(`Opening ${beneficiary.name} - Data Purchase`, 'info');
          router.push({
            pathname: '/vtu/buy-data',
            params: {
              beneficiaryPhone: beneficiary.phone || '',
              beneficiaryNetwork: beneficiary.network || '',
              beneficiaryName: beneficiary.name,
            }
          });
          break;
        case 'betting':
          showNotification(`Opening ${beneficiary.name} - Betting`, 'info');
          router.push({
            pathname: '/vtu/fund-betting',
            params: {
              beneficiaryCustomerId: beneficiary.customerId || '',
              beneficiaryServiceId: beneficiary.serviceId || '',
              beneficiaryName: beneficiary.name,
            }
          });
          break;
        case 'cable':
          showNotification(`Opening ${beneficiary.name} - Cable TV`, 'info');
          router.push({
            pathname: '/vtu/buy-cable',
            params: {
              beneficiaryCustomerId: beneficiary.customerId || '',
              beneficiaryServiceId: beneficiary.serviceId || '',
              beneficiaryVariationId: beneficiary.variationId || '',
              beneficiaryName: beneficiary.name,
            }
          });
          break;
        case 'electricity':
          showNotification(`Opening ${beneficiary.name} - Electricity`, 'info');
          router.push({
            pathname: '/vtu/buy-electricity',
            params: {
              beneficiaryMeterNumber: beneficiary.meterNumber || '',
              beneficiaryServiceId: beneficiary.serviceId || '',
              beneficiaryVariationId: beneficiary.variationId || '',
              beneficiaryName: beneficiary.name,
            }
          });
          break;
        case 'transfer':
          showNotification(`Opening ${beneficiary.name} - Transfer`, 'info');
          router.push({
            pathname: '/transfers',
            params: {
              beneficiaryAccountNumber: beneficiary.accountNumber || '',
              beneficiaryBankName: beneficiary.bankName || '',
              beneficiaryBankCode: beneficiary.bankCode || '',
              beneficiaryName: beneficiary.name,
            }
          });
          break;
      }
      
      onBeneficiaryPress?.(beneficiary);
    } catch (error) {
      showNotification('Failed to open beneficiary details', 'error');
      console.error('Navigation error:', error);
    }
  };

  const renderBeneficiary = ({ item }: { item: Beneficiary }) => (
    <BeneficiaryItem
      item={item}
      isDark={isDark}
      getServiceIcon={getServiceIcon}
      getServiceColor={getServiceColor}
      getDisplayText={getDisplayText}
      onPress={handleBeneficiaryPress}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>
          Saved Beneficiaries
        </ThemedText>
        <ThemedText style={[styles.count, { color: isDark ? Palette.white : Palette.grayDark }]}>
          {beneficiaries.length}
        </ThemedText>
      </View>
      
      <View style={[
        styles.card, 
        { 
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : Palette.white,
          shadowColor: isDark ? '#000' : '#000',
        }
      ]}>
        <FlatList
          data={beneficiaries.slice(0, 5)} // Show up to 5 beneficiaries since we removed "See All"
          renderItem={renderBeneficiary}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ width: 20 }} />}
        />
      </View>
      
    
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.grayDark,
  },
  count: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.6,
  },
  card: {
    borderRadius: 20,

    overflow: 'hidden',
  },
  list: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: 'space-around',
  },
  beneficiaryCard: {
    width: 100,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 3,
    // Enhanced glassy effect
    backdropFilter: 'blur(10px)', // For web
  },
  beneficiaryInfo: {
    alignItems: 'center',
    flex: 1,
  },
  beneficiaryName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  beneficiaryDetails: {
    fontSize: 10,
    opacity: 0.7,
    textAlign: 'center',
    fontWeight: '400',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
    textAlign: 'center',
  },
});
