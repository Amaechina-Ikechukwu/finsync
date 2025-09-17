import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNotification } from '@/components/InAppNotificationProvider';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import CustomAlert from '@/components/ui/CustomAlert';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TextInputAlert from '@/components/ui/TextInputAlert';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';
import { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { ElectricityCustomerInfo, electricityService } from '@/services/apiService';
import { useAppStore } from '@/store';

interface ElectricityProvider {
  id: string;
  name: string;
  fullName: string;
  color: string;
  variations: string[];
}

const electricityProviders: ElectricityProvider[] = [
  { id: 'abuja-electric', name: 'AEDC', fullName: 'Abuja Electricity Distribution Company', color: '#0066CC', variations: ['prepaid', 'postpaid'] },
  { id: 'abeokuta-electric', name: 'ABEDC', fullName: 'Abeokuta Electricity Distribution Company', color: '#FF6B35', variations: ['prepaid', 'postpaid'] },
  { id: 'benin-electric', name: 'BEDC', fullName: 'Benin Electricity Distribution Company', color: '#00A651', variations: ['prepaid', 'postpaid'] },
  { id: 'eko-electric', name: 'EKEDC', fullName: 'Eko Electricity Distribution Company', color: '#E60012', variations: ['prepaid', 'postpaid'] },
  { id: 'enugu-electric', name: 'EEDC', fullName: 'Enugu Electricity Distribution Company', color: '#8B4513', variations: ['prepaid', 'postpaid'] },
  { id: 'ibadan-electric', name: 'IBEDC', fullName: 'Ibadan Electricity Distribution Company', color: '#9932CC', variations: ['prepaid', 'postpaid'] },
  { id: 'ikeja-electric', name: 'IKEDC', fullName: 'Ikeja Electric Distribution Company', color: '#FF1493', variations: ['prepaid', 'postpaid'] },
  { id: 'jos-electric', name: 'JED', fullName: 'Jos Electricity Distribution Company', color: '#32CD32', variations: ['prepaid', 'postpaid'] },
  { id: 'kaduna-electric', name: 'KEDCO', fullName: 'Kaduna Electric Distribution Company', color: '#4169E1', variations: ['prepaid', 'postpaid'] },
  { id: 'kano-electric', name: 'KAEDCO', fullName: 'Kano Electricity Distribution Company', color: '#DC143C', variations: ['prepaid', 'postpaid'] },
  { id: 'portharcourt-electric', name: 'PHED', fullName: 'Port Harcourt Electricity Distribution Company', color: '#20B2AA', variations: ['prepaid', 'postpaid'] },
  { id: 'yola-electric', name: 'YEDC', fullName: 'Yola Electricity Distribution Company', color: '#FF8C00', variations: ['prepaid', 'postpaid'] },
];

// Helper function to get lighter version of colors
const getLighterColor = (color: string) => {
  // Convert hex to rgba with 20% opacity
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return `rgba(${r}, ${g}, ${b}, 0.2)`;
};

export default function BuyElectricity() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { showNotification } = useNotification();
  const { alertState, hideAlert, showConfirm } = useCustomAlert();
  const { addBeneficiary } = useAppStore();
  
  const [meterNumber, setMeterNumber] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<ElectricityProvider | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<string>('');
  const [customerInfo, setCustomerInfo] = useState<ElectricityCustomerInfo | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showBeneficiaryModal, setShowBeneficiaryModal] = useState(false);
  const [beneficiaryData, setBeneficiaryData] = useState<{
    meterNumber: string;
    serviceId: string;
    variationId: string;
    customerName?: string;
  } | null>(null);

  const cardBg = isDark ? Palette.lighterBlack : Palette.white;
  const borderColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
  const buttonBg = isDark ? Palette.bolderBlack : '#F5F5F5';

  // Get beneficiary data from router params
  const { 
    beneficiaryMeterNumber,
    beneficiaryServiceId,
    beneficiaryVariationId,
    beneficiaryName
  } = useLocalSearchParams<{ 
    beneficiaryMeterNumber: string;
    beneficiaryServiceId: string;
    beneficiaryVariationId: string;
    beneficiaryName: string;
  }>();

  // Auto-populate beneficiary data if available
  useEffect(() => {
    if (beneficiaryMeterNumber && beneficiaryServiceId && beneficiaryVariationId && beneficiaryName) {
      setMeterNumber(beneficiaryMeterNumber);
      setSelectedVariation(beneficiaryVariationId);
      
      // Find and select the provider
      const provider = electricityProviders.find(p => p.id === beneficiaryServiceId);
      if (provider) {
        setSelectedProvider(provider);
        showNotification(`Auto-filled data for ${beneficiaryName}`, 'success');
      }
    }
  }, [beneficiaryMeterNumber, beneficiaryServiceId, beneficiaryVariationId, beneficiaryName]);

  const handleProviderSelect = (provider: ElectricityProvider) => {
    setSelectedProvider(provider);
    setSelectedVariation(''); // Reset variation when changing provider
    // Reset verification status when changing provider
    setIsVerified(false);
    setCustomerInfo(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleVariationSelect = (variation: string) => {
    setSelectedVariation(variation);
    // Reset verification status when changing variation
    setIsVerified(false);
    setCustomerInfo(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleMeterChange = (text: string) => {
    setMeterNumber(text);
    // Reset verification status when changing meter number
    setIsVerified(false);
    setCustomerInfo(null);
  };

  const verifyMeter = async () => {
    if (!selectedProvider) {
      showNotification('Please select an electricity provider', 'error');
      return;
    }

    if (!selectedVariation) {
      showNotification('Please select meter type (Prepaid/Postpaid)', 'error');
      return;
    }

    if (!meterNumber.trim()) {
      showNotification('Please enter meter number', 'error');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await electricityService.verifyMeter({
        meter_number: meterNumber.trim(),
        service_id: selectedProvider.id,
        variation_id: selectedVariation,
      });

      if (response.success && response.data) {
        setCustomerInfo(response.data);
        setIsVerified(true);
        showNotification('Meter verified successfully', 'success');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        showNotification(response.message || 'Failed to verify meter', 'error');
        setIsVerified(false);
        setCustomerInfo(null);
      }
    } catch (error) {
      console.error('Meter verification error:', error);
      showNotification('Error verifying meter', 'error');
      setIsVerified(false);
      setCustomerInfo(null);
    } finally {
      setIsVerifying(false);
    }
  };
  const proceedToPayment = () => {
    showNotification('Electricity payment coming soon!', 'info');
    // TODO: Navigate to payment screen when implemented
    
    // Ask to save as beneficiary after successful verification
    if (isVerified && customerInfo && selectedProvider && selectedVariation) {
      setBeneficiaryData({
        meterNumber: meterNumber.trim(),
        serviceId: selectedProvider.id,
        variationId: selectedVariation,
        customerName: customerInfo.customer_name,
      });
      
      showConfirm(
        'Save Beneficiary',
        'Would you like to save this electricity meter as a beneficiary for future use?',
        () => {
          setShowBeneficiaryModal(true);
        },
        () => {
          setBeneficiaryData(null);
        }
      );
    }
  };

  const saveBeneficiary = (name: string) => {
    if (beneficiaryData) {
      const result = addBeneficiary({
        name,
        meterNumber: beneficiaryData.meterNumber,
        serviceId: beneficiaryData.serviceId,
        variationId: beneficiaryData.variationId,
        serviceType: 'electricity',
      });
      
      if (result.success) {
        showNotification(result.message, 'success');
      } else {
        showNotification(result.message, 'error');
      }
      
      setBeneficiaryData(null);
      setShowBeneficiaryModal(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? Palette.black : '#F5F5F5' }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: cardBg }]}
            onPress={() => router.back()}
          >
            <IconSymbol 
              name="chevron.left" 
              size={20} 
              color={isDark ? Palette.white : Palette.black} 
            />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Pay Electricity Bill</ThemedText>
          <View style={styles.placeholder} />
        </View>

        {/* Electricity Provider Selection */}
        <View style={[styles.card, { backgroundColor: cardBg,  }]}>
          <ThemedText style={styles.sectionTitle}>Select Electricity Provider</ThemedText>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.providersScroll}
            contentContainerStyle={styles.providersContent}
          >
            {electricityProviders.map((provider) => (
              <TouchableOpacity
                key={provider.id}
                style={[
                  styles.providerCard,
                  {
                    backgroundColor: selectedProvider?.id === provider.id 
                      ? getLighterColor(provider.color)
                      : buttonBg,
                    borderColor: selectedProvider?.id === provider.id 
                      ? provider.color 
                      : borderColor,
                  }
                ]}
                onPress={() => handleProviderSelect(provider)}
              >
                <IconSymbol 
                  name="flash"
                  size={20} 
                  color={selectedProvider?.id === provider.id ? provider.color : (isDark ? Palette.white : Palette.black)} 
                />
                <ThemedText 
                  style={[
                    styles.providerName,
                    { color: selectedProvider?.id === provider.id ? provider.color : undefined }
                  ]}
                >
                  {provider.name}
                </ThemedText>
                <ThemedText 
                  style={[
                    styles.providerFullName,
                    { color: selectedProvider?.id === provider.id ? provider.color : undefined }
                  ]}
                  numberOfLines={2}
                >
                  {provider.fullName}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Meter Type Selection */}
        {selectedProvider && (
          <View style={[styles.card, { backgroundColor: cardBg, }]}>
            <ThemedText style={styles.sectionTitle}>Select Meter Type</ThemedText>
            <View style={styles.variationsGrid}>
              {selectedProvider.variations.map((variation) => (
                <TouchableOpacity
                  key={variation}
                  style={[
                    styles.variationCard,
                    {
                      backgroundColor: selectedVariation === variation 
                        ? getLighterColor(selectedProvider.color)
                        : buttonBg,
                      borderColor: selectedVariation === variation 
                        ? selectedProvider.color 
                        : borderColor,
                    }
                  ]}
                  onPress={() => handleVariationSelect(variation)}
                >
                  <IconSymbol 
                    name={variation === 'prepaid' ? 'receipt' : 'doc.text.fill'}
                    size={20} 
                    color={selectedVariation === variation ? selectedProvider.color : (isDark ? Palette.white : Palette.black)} 
                  />                  <ThemedText 
                    style={[
                      styles.variationName,
                      { color: selectedVariation === variation ? selectedProvider.color : undefined }
                    ]}
                  >
                    {variation.charAt(0).toUpperCase() + variation.slice(1)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Meter Number Input */}
        <ThemedView style={[styles.card, { backgroundColor: cardBg, }]}>
          <ThemedText style={styles.sectionTitle}>Meter Number</ThemedText>
          <ThemedTextInput
            style={styles.input}
            placeholder="Enter meter number"
            value={meterNumber}
            onChangeText={handleMeterChange}
            keyboardType="numeric"
            maxLength={20}
          />
          
          <AppButton
            title={isVerifying ? "Verifying..." : "Verify Meter"}
            onPress={verifyMeter}
            disabled={isVerifying || !selectedProvider || !selectedVariation || !meterNumber.trim()}
            style={{
              ...styles.verifyButton,
              backgroundColor: (isVerifying || !selectedProvider || !selectedVariation || !meterNumber.trim()) 
                ? (isDark ? '#333' : '#ccc')
                : selectedProvider?.color || Palette.info
            }}
          />
        </ThemedView>

        {/* Customer Information (shown after verification) */}
        {isVerified && customerInfo && (
          <ThemedView style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.verificationHeader}>              <IconSymbol 
                name="add" 
                size={24} 
                color={isDark ? "#22C55E" : "#00A651"} 
              />
              <ThemedText style={[styles.verificationTitle, { color: isDark ? "#22C55E" : "#00A651" }]}>
                Meter Verified Successfully
              </ThemedText>
            </View>
            
            <View style={styles.customerInfo}>
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Customer Name:</ThemedText>
                <ThemedText style={styles.infoValue}>{customerInfo.customer_name}</ThemedText>
              </View>
              
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Customer Number:</ThemedText>
                <ThemedText style={styles.infoValue}>{customerInfo.customer_number}</ThemedText>
              </View>
              
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Address:</ThemedText>
                <ThemedText style={styles.infoValue}>{customerInfo.customer_address}</ThemedText>
              </View>
              
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Meter Number:</ThemedText>
                <ThemedText style={styles.infoValue}>{customerInfo.meter_number}</ThemedText>
              </View>
              
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Customer Type:</ThemedText>
                <ThemedText style={styles.infoValue}>{customerInfo.customer_type}</ThemedText>
              </View>
              
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Tariff:</ThemedText>
                <ThemedText style={styles.infoValue}>{customerInfo.tariff}</ThemedText>
              </View>
              
              {customerInfo.balance && (
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Balance:</ThemedText>
                  <ThemedText style={styles.infoValue}>₦{customerInfo.balance}</ThemedText>
                </View>
              )}
              
              {customerInfo.due_date && (
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Due Date:</ThemedText>
                  <ThemedText style={styles.infoValue}>{customerInfo.due_date}</ThemedText>
                </View>
              )}
            </View>

            <AppButton
              title="Continue to Payment"
              onPress={proceedToPayment}
              style={{
                ...styles.continueButton,
                backgroundColor: selectedProvider?.color || Palette.info
              }}
            />
          </ThemedView>
        )}
      </ScrollView>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        onRequestClose={hideAlert}
        icon={alertState.icon}
      />

      {/* Beneficiary Save Modal */}
      <TextInputAlert
        visible={showBeneficiaryModal}
        title="Save as Beneficiary"
        message={`Enter a name for ${customerInfo?.customer_name || 'this electricity meter'}`}
        placeholder="Enter beneficiary name"
        onConfirm={saveBeneficiary}
        onCancel={() => {
          setShowBeneficiaryModal(false);
          setBeneficiaryData(null);
        }}
        defaultValue={beneficiaryData?.customerName || ''}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Belgrano-Regular',
  },
  placeholder: {
    width: 40,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    fontFamily: 'Belgrano-Regular',
  },
  providersScroll: {
    marginHorizontal: -20,
  },
  providersContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  providerCard: {
    width: 140,
    padding: 12,
    borderRadius: 12,
   
    alignItems: 'center',
    minHeight: 80,
  },
  providerName: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    fontFamily: 'Belgrano-Regular',
  },
  providerFullName: {
    fontSize: 9,
    textAlign: 'center',
    marginTop: 2,
    fontFamily: 'Belgrano-Regular',
    opacity: 0.8,
  },
  variationsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  variationCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  variationName: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    fontFamily: 'Belgrano-Regular',
  },
  input: {
    marginBottom: 16,
  },
  verifyButton: {
    borderRadius: 12,
    paddingVertical: 16,
  },
  verificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    fontFamily: 'Belgrano-Regular',
  },
  customerInfo: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Belgrano-Regular',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Belgrano-Regular',
    flex: 2,
    textAlign: 'right',
  },
  continueButton: {
    borderRadius: 12,
    paddingVertical: 16,
  },
});
