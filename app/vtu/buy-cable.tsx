import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { CableCustomerInfo, CableVariation, cableService } from '@/services/apiService';
import { useAppStore } from '@/store';

interface CableProvider {
  id: string;
  name: string;
  color: string;
  icon: string;
}

const cableProviders: CableProvider[] = [
  { id: 'gotv', name: 'GOtv', color: '#006633', icon: 'tv' },
  { id: 'dstv', name: 'DStv', color: '#FFA500', icon: 'tv' },
  { id: 'startimes', name: 'Startimes', color: '#FF6B35', icon: 'tv' },
  { id: 'showmax', name: 'Showmax', color: '#E50914', icon: 'play.tv' },
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

// Memoized style calculations to prevent recreation on every render
const getProviderStyles = (provider: CableProvider | null, isDark: boolean, isSelected: boolean) => {
  if (!provider) return {};
  
  return {
    selectedBackground: getLighterColor(provider.color),
    selectedBorder: provider.color,
    selectedText: provider.color,
    buttonBackground: isSelected ? provider.color : (isDark ? '#333' : '#ccc')
  };
};

export default function BuyCable() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { showNotification } = useNotification();
  const { alertState, hideAlert, showConfirm } = useCustomAlert();
  const { addBeneficiary, userData } = useAppStore();
  
  // Get beneficiary data from router params
  const { 
    beneficiaryCustomerId,
    beneficiaryServiceId,
    beneficiaryVariationId,
    beneficiaryName
  } = useLocalSearchParams<{ 
    beneficiaryCustomerId: string;
    beneficiaryServiceId: string;
    beneficiaryVariationId: string;
    beneficiaryName: string;
  }>();
  
  const [smartcardNumber, setSmartcardNumber] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<CableProvider | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CableCustomerInfo | null>(null);
  const [cableVariations, setCableVariations] = useState<CableVariation[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<CableVariation | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showBeneficiaryModal, setShowBeneficiaryModal] = useState(false);
  const [beneficiaryData, setBeneficiaryData] = useState<{ 
    customerId: string; 
    serviceId: string; 
    customerName?: string; 
  } | null>(null);

  const cardBg = isDark ? Palette.lighterBlack : Palette.white;
  const borderColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
  const buttonBg = isDark ? Palette.bolderBlack : '#F5F5F5';

  // Memoize style calculations to prevent re-renders
  const providerStyles = useMemo(() => {
    if (!selectedProvider) return {};
    return {
      selectedBackground: getLighterColor(selectedProvider.color),
      selectedBorder: selectedProvider.color,
      selectedText: selectedProvider.color,
      disabledBackground: isDark ? '#333' : '#ccc',
      enabledBackground: selectedProvider.color
    };
  }, [selectedProvider, isDark]);

  const planStyles = useMemo(() => {
    if (!selectedProvider) return {};
    return {
      selectedBackground: getLighterColor(selectedProvider.color),
      selectedBorder: selectedProvider.color,
      selectedText: selectedProvider.color
    };
  }, [selectedProvider]);
  const handleProviderSelect = useCallback(async (provider: CableProvider) => {
    setSelectedProvider(provider);
    // Reset verification status when changing provider
    setIsVerified(false);
    setCustomerInfo(null);
    setCableVariations([]);
    setSelectedPlan(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Load cable plans for the selected provider
    await loadCableVariations(provider.id);
  }, [loadCableVariations]);

  const loadCableVariations = useCallback(async (serviceId: string) => {
    setIsLoadingPlans(true);
    try {
      const response = await cableService.getCableVariations(serviceId);
      
      if (response.success && response.data) {
        // Handle both nested and flat response structures
        const variations = (response.data as any).data || response.data;
        setCableVariations(variations);
      } else {
        showNotification(response.message || 'Failed to load cable plans', 'error');
      }
    } catch (error) {
      console.error('Error loading cable variations:', error);
      showNotification('Error loading cable plans', 'error');
    } finally {
      setIsLoadingPlans(false);
    }
  }, [showNotification]);

  const handleSmartcardChange = useCallback((text: string) => {
    setSmartcardNumber(text);
    // Reset verification status when changing smartcard number
    setIsVerified(false);
    setCustomerInfo(null);
  }, []);
  const verifySmartcard = useCallback(async () => {
    if (!selectedProvider) {
      showNotification('Please select a cable provider', 'error');
      return;
    }

    if (!smartcardNumber.trim()) {
      showNotification('Please enter smartcard number', 'error');
      return;
    }

    setIsVerifying(true);
    showNotification('Getting customer details...', 'info');
    try {
      const response = await cableService.verifyCable({
        service_id: selectedProvider.id,
        customer_id: smartcardNumber.trim(),
      });

      if (response.success && response.data) {
        // Handle both nested and flat response structures
        const customerData = (response.data as any).data || response.data;
        setCustomerInfo(customerData);
        setIsVerified(true);
        showNotification('Smartcard verified successfully', 'success');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        showNotification(response.message || 'Failed to verify smartcard', 'error');
        setIsVerified(false);
        setCustomerInfo(null);
      }
    } catch (error) {
      console.error('Cable verification error:', error);
      showNotification('Error verifying smartcard', 'error');
      setIsVerified(false);
      setCustomerInfo(null);
    } finally {
      setIsVerifying(false);
    }
  }, [selectedProvider, smartcardNumber, showNotification]);
  const subscribeToCable = useCallback(async () => {
    if (!selectedProvider || !selectedPlan || !customerInfo) {
      showNotification('Please complete all required fields', 'error');
      return;
    }

    setIsSubscribing(true);
    try {
      const response = await cableService.subscribeCable({
        customer_id: smartcardNumber.trim(),
        service_id: selectedProvider.id,
        variation_id: selectedPlan.variation_id,
      });

      if (response.success) {
        showNotification('Cable subscription successful!', 'success');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        
        // Ask to save as beneficiary after successful subscription
        setBeneficiaryData({
          customerId: smartcardNumber.trim(),
          serviceId: selectedProvider.id,
          customerName: customerInfo.customer_name,
        });
        
        showConfirm(
          'Save Beneficiary',
          'Would you like to save this cable subscription as a beneficiary for future use?',
          () => {
            setShowBeneficiaryModal(true);
          },
          () => {
            setBeneficiaryData(null);
            // Navigate back or reset form
            router.back();
          }
        );
      } else {
        showNotification(response.message || 'Cable subscription failed', 'error');
      }
    } catch (error) {
      console.error('Cable subscription error:', error);
      showNotification('Error processing cable subscription', 'error');
    } finally {
      setIsSubscribing(false);
    }
  }, [selectedProvider, selectedPlan, customerInfo, smartcardNumber, showNotification, showConfirm]);

  const proceedToPayment = useCallback(() => {
    if (!selectedPlan) {
      showNotification('Please select a cable plan', 'error');
      return;
    }

    // Check if customer status is closed
    if (customerInfo?.status === 'Closed') {
      showNotification('Cannot subscribe to a closed account. Please contact customer service to reactivate your account.', 'error');
      return;
    }

    // Check if user has sufficient balance
    const planPrice = typeof selectedPlan.price === 'number'
      ? selectedPlan.price
      : parseFloat(selectedPlan.price as string || '0');
    
    if (userData.amount < planPrice) {
      showNotification('Insufficient balance to subscribe to this plan. Please fund your account.', 'error');
      return;
    }
    
    showConfirm(
      'Confirm Subscription',
      `Subscribe to ${selectedPlan.package_bouquet} for ₦${selectedPlan.price}?`,
      subscribeToCable,
      () => {}
    );
  }, [selectedPlan, customerInfo, userData.amount, showNotification, showConfirm, subscribeToCable]);

  const saveBeneficiary = useCallback((name: string) => {
    if (beneficiaryData) {
      const result = addBeneficiary({
        name,
        customerId: beneficiaryData.customerId,
        serviceId: beneficiaryData.serviceId,
        serviceType: 'cable' as any, // We'll extend the service types in the store
      });
      
      if (result.success) {
        showNotification(result.message, 'success');
      } else {
        showNotification(result.message, 'error');
      }
      
      setBeneficiaryData(null);
      setShowBeneficiaryModal(false);
    }
  }, [beneficiaryData, addBeneficiary, showNotification]);

  // Auto-populate smartcard number and provider from URL params (deep link)
  useEffect(() => {
    
    // Pre-fill beneficiary data if available
    if (beneficiaryCustomerId && beneficiaryServiceId && beneficiaryName) {
      setSmartcardNumber(beneficiaryCustomerId);
      const provider = cableProviders.find(p => p.id === beneficiaryServiceId);
      if (provider) {
        setSelectedProvider(provider);
        // Load cable plans for the provider and then auto-verify
        loadCableVariations(provider.id).then(() => {
          // Auto-verify the smartcard after a short delay to ensure state is updated
          setTimeout(() => {
            verifySmartcard();
          }, 500);
        });
        showNotification(`Auto-filled data for ${beneficiaryName}`, 'success');
      } else {
      }
    }
  }, [beneficiaryCustomerId, beneficiaryServiceId, beneficiaryName, loadCableVariations, showNotification, verifySmartcard]);

  // Auto-select plan when cable variations are loaded and we have a beneficiary variation ID
  useEffect(() => {
    if (beneficiaryVariationId && cableVariations.length > 0) {
      const plan = cableVariations.find(v => v.variation_id.toString() === beneficiaryVariationId);
      if (plan) {
        setSelectedPlan(plan);
      } else {
      }
    } else if (cableVariations.length > 0 && beneficiaryCustomerId && !beneficiaryVariationId) {
      // If we have beneficiary data but no variation ID, just show the plans for selection
      showNotification('Please select a cable plan from the available options', 'info');
    }
  }, [cableVariations, beneficiaryVariationId, beneficiaryCustomerId, showNotification]);

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
          <ThemedText style={styles.headerTitle}>Buy Cable Subscription</ThemedText>
          <View style={styles.placeholder} />
        </View>

        {/* Cable Provider Selection */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>Select Cable Provider</ThemedText>
          <View style={styles.providersGrid}>
            {cableProviders.map((provider) => (
              <TouchableOpacity
                key={provider.id}
                style={[
                  styles.providerCard,
                  {
                    backgroundColor: selectedProvider?.id === provider.id 
                      ? providerStyles.selectedBackground
                      : buttonBg,
                    borderColor: selectedProvider?.id === provider.id 
                      ? providerStyles.selectedBorder
                      : borderColor,
                  }
                ]}
                onPress={() => handleProviderSelect(provider)}
              >
                <IconSymbol 
                  name={provider.icon as any}
                  size={24} 
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
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Smartcard Number Input */}
        <ThemedView style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>Smartcard Number</ThemedText>
          <ThemedTextInput
            style={styles.input}
            placeholder="Enter smartcard number"
            value={smartcardNumber}
            onChangeText={handleSmartcardChange}
            keyboardType="numeric"
            maxLength={15}
          />
          
          <AppButton
            title={isVerifying ? "Verifying..." : "Verify Smartcard"}
            onPress={verifySmartcard}
            disabled={isVerifying || !selectedProvider || !smartcardNumber.trim()}
            style={[
              styles.verifyButton,
              {
                backgroundColor: (isVerifying || !selectedProvider || !smartcardNumber.trim()) 
                  ? providerStyles.disabledBackground || (isDark ? '#333' : '#ccc')
                  : providerStyles.enabledBackground || Palette.info
              }
            ]}
          />        </ThemedView>

        {/* Cable Plans Selection */}
        {selectedProvider && (
          <ThemedView style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <ThemedText style={styles.sectionTitle}>Select Cable Plan</ThemedText>
            {isLoadingPlans ? (
              <ThemedText style={styles.loadingText}>Loading plans...</ThemedText>
            ) : cableVariations.length > 0 ? (
              <View style={styles.plansContainer}>
                {cableVariations.map((plan) => (
                  <TouchableOpacity
                    key={plan.variation_id}
                    style={[
                      styles.planCard,
                      {
                        backgroundColor: selectedPlan?.variation_id === plan.variation_id 
                          ? planStyles.selectedBackground
                          : buttonBg,
                        borderColor: selectedPlan?.variation_id === plan.variation_id 
                          ? planStyles.selectedBorder
                          : borderColor,
                      }
                    ]}
                    onPress={() => {
                      setSelectedPlan(plan);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <View style={styles.planHeader}>
                      <ThemedText style={[
                        styles.planName,
                        { 
                          color: selectedPlan?.variation_id === plan.variation_id 
                            ? planStyles.selectedText
                            : (isDark ? '#FFFFFF' : '#000000')
                        }
                      ]}>
                        {plan.package_bouquet}
                      </ThemedText>
                      <ThemedText style={[
                        styles.planPrice,
                        { 
                          color: selectedPlan?.variation_id === plan.variation_id 
                            ? planStyles.selectedText
                            : (isDark ? '#FFFFFF' : '#000000')
                        }
                      ]}>
                        ₦{plan.price}
                      </ThemedText>
                    </View>
                    <ThemedText style={[
                      styles.planService,
                      { opacity: isDark ? 0.8 : 0.7 }
                    ]}>
                      {plan.service_name}
                    </ThemedText>
                    {/* {plan.discount_percentage && plan.discount_percentage !== '0%' && (
                      <View style={styles.discountBadge}>
                        <ThemedText style={styles.discountText}>{plan.discount_percentage} OFF</ThemedText>
                      </View>
                    )} */}
                    <ThemedText style={[
                      styles.planAvailability,
                      { color: plan.availability === 'Available' ? '#00A651' : '#FF6B6B' }
                    ]}>
                      {plan.availability}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <ThemedText style={styles.loadingText}>No plans available for this provider</ThemedText>
            )}
          </ThemedView>
        )}

        {/* Customer Information (shown after verification) */}
        {isVerified && customerInfo && (
          <ThemedView style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.verificationHeader}>
              <IconSymbol 
                name="plus.circle.fill" 
                size={24} 
                color={isDark ? "#22C55E" : "#00A651"} 
              />
              <ThemedText style={[styles.verificationTitle, { color: isDark ? "#22C55E" : "#00A651" }]}>
                Verified Successfully
              </ThemedText>
            </View>
            
            <View style={styles.customerInfo}>
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Customer Name:</ThemedText>
                <ThemedText style={styles.infoValue}>{customerInfo.customer_name}</ThemedText>
              </View>
              
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Customer ID:</ThemedText>
                <ThemedText style={styles.infoValue}>{customerInfo.customer_id}</ThemedText>
              </View>
              
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Status:</ThemedText>
                <ThemedText style={[
                  styles.infoValue,
                  { 
                    color: customerInfo.status === 'Open' 
                      ? '#00A651' 
                      : customerInfo.status === 'Closed' 
                        ? '#FF6B6B'
                        : '#FFA500' // Orange for unknown/empty status
                  }
                ]}>
                  {customerInfo.status || 'Unknown'}
                </ThemedText>
              </View>
              
              {customerInfo.current_bouquet && customerInfo.current_bouquet.trim() !== '' && (
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Current Package:</ThemedText>
                  <ThemedText style={styles.infoValue}>{customerInfo.current_bouquet}</ThemedText>
                </View>
              )}
              
              {/* Show balance calculation when plan is selected */}
              {selectedPlan && (
                (() => {
                  const userBalance = userData.amount;
                  const planPrice = typeof selectedPlan.price === 'number' 
                    ? selectedPlan.price 
                    : parseFloat(selectedPlan.price as string || '0');
                  const newBalance = userBalance - planPrice;
                  
                  // Only show calculation if user has sufficient balance
                  if (userBalance >= planPrice) {
                    return (
                      <>
                        <View style={styles.infoRow}>
                          <ThemedText style={styles.infoLabel}>Available Balance:</ThemedText>
                          <ThemedText style={[styles.infoValue, { color: '#00A651' }]}>
                            ₦{userBalance.toFixed(2)}
                          </ThemedText>
                        </View>
                        <View style={styles.infoRow}>
                          <ThemedText style={styles.infoLabel}>Plan Cost:</ThemedText>
                          <ThemedText style={[styles.infoValue, { color: '#FF6B6B' }]}>
                            -₦{planPrice.toFixed(2)}
                          </ThemedText>
                        </View>
                        <View style={[styles.infoRow, { borderBottomWidth: 2, borderBottomColor: isDark ? '#333' : '#ddd' }]}>
                          <ThemedText style={[styles.infoLabel, { fontWeight: 'bold' }]}>New Balance:</ThemedText>
                          <ThemedText style={[
                            styles.infoValue, 
                            { 
                              fontWeight: 'bold',
                              color: '#00A651'
                            }
                          ]}>
                            ₦{newBalance.toFixed(2)}
                          </ThemedText>
                        </View>
                      </>
                    );
                  } else {
                    // Show insufficient balance warning
                    return (
                      <View style={[styles.infoRow, { backgroundColor: 'rgba(255, 107, 107, 0.1)', padding: 12, borderRadius: 8, marginTop: 8 }]}>
                        <IconSymbol name="exclamationmark.triangle" size={20} color="#FF6B6B" />
                        <ThemedText style={[styles.infoLabel, { marginLeft: 8, color: '#FF6B6B', fontWeight: 'bold' }]}>
                          Insufficient balance. You need ₦{(planPrice - userBalance).toFixed(2)} more to subscribe to this plan.
                        </ThemedText>
                      </View>
                    );
                  }
                })()
              )}
              
              {customerInfo.due_date && customerInfo.due_date.trim() !== '' && (
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Due Date:</ThemedText>
                  <ThemedText style={styles.infoValue}>
                    {new Date(customerInfo.due_date).toLocaleDateString()}
                  </ThemedText>
                </View>
              )}

              {customerInfo.renewal_amount && customerInfo.renewal_amount.trim() !== '' && (
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Renewal Amount:</ThemedText>
                  <ThemedText style={styles.infoValue}>₦{customerInfo.renewal_amount}</ThemedText>
                </View>
              )}
            </View>

            <AppButton
              title={isSubscribing ? "Processing..." : "Subscribe to Plan"}
              onPress={proceedToPayment}
              disabled={!selectedPlan || isSubscribing || customerInfo?.status === 'Closed' || (selectedPlan && userData.amount < (typeof selectedPlan.price === 'number' ? selectedPlan.price : parseFloat(selectedPlan.price as string || '0')))}
              style={{
                ...styles.continueButton,
                backgroundColor: (!selectedPlan || isSubscribing || customerInfo?.status === 'Closed' || (selectedPlan && userData.amount < (typeof selectedPlan.price === 'number' ? selectedPlan.price : parseFloat(selectedPlan.price as string || '0'))))
                  ? (isDark ? '#333' : '#ccc')
                  : selectedProvider?.color || Palette.info
              }}
            />
          </ThemedView>
        )}
      </ScrollView>      {/* Custom Alert */}
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
        message={`Enter a name for ${customerInfo?.customer_name || 'this cable subscription'}`}
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
  providersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  providerCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    marginBottom: 12,
  },
  providerName: {
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
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Belgrano-Regular',
    flex: 1,
  },  infoValue: {
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
  plansContainer: {
    gap: 12,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 14,
    opacity: 0.7,
    paddingVertical: 20,
  },
  planCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    position: 'relative',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Belgrano-Regular',
    flex: 1,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Belgrano-Regular',
  },
  planService: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  planAvailability: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
