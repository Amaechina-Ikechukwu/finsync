import * as Contacts from 'expo-contacts';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ContactSelectionModal from '@/components/ContactSelectionModal';
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
import apiClient from '@/services/apiService';
import { useAppStore } from '@/store';

const { width: screenWidth } = Dimensions.get('window');

interface Contact {
  name: string;
  phone: string;
  originalPhone?: string;
}

interface BettingService {
  id: string;
  name: string;
  logo?: string;
}

interface CustomerData {
  service_name: string;
  customer_id: string;
  customer_name: string;
  customer_username: string;
  customer_email_address: string;
  customer_phone_number: string;
  minimum_amount: number;
  maximum_amount: number;
}

interface BeneficiaryData {
  customerId: string;
  serviceId: string;
  contactName?: string;
}

const bettingServices: BettingService[] = [
  { id: '1xBet', name: '1xBet', logo: 'betting-logos/1xbet.png' },
  { id: 'BangBet', name: 'BangBet', logo: 'betting-logos/bangbet.png' },
  { id: 'Bet9ja', name: 'Bet9ja', logo: 'betting-logos/bet9ja.png' },
  { id: 'BetKing', name: 'BetKing', logo: 'betting-logos/betking.png' },
  { id: 'BetLand', name: 'BetLand', logo: 'betting-logos/betland.png' },
  { id: 'BetLion', name: 'BetLion', logo: 'betting-logos/betlion.png' },
  { id: 'BetWay', name: 'BetWay', logo: 'betting-logos/betway.png' },
  { id: 'CloudBet', name: 'CloudBet', logo: 'betting-logos/cloudbet.png' },
  { id: 'LiveScoreBet', name: 'LiveScoreBet', logo: 'betting-logos/livescorebet.png' },
  { id: 'MerryBet', name: 'MerryBet', logo: 'betting-logos/merrybet.png' },
  { id: 'NaijaBet', name: 'NaijaBet', logo: 'betting-logos/naijabet.png' },
  { id: 'NairaBet', name: 'NairaBet', logo: 'betting-logos/nairabet.png' },
  { id: 'SupaBet', name: 'SupaBet', logo: 'betting-logos/supabet.png' },
];

export default function FundBetting() {  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { showNotification } = useNotification();
  const { alertState, hideAlert, showConfirm } = useCustomAlert();
  const { userData, addBeneficiary } = useAppStore();

  // Form states
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedService, setSelectedService] = useState<BettingService | null>(null);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Contact states
  const [showContactModal, setShowContactModal] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactName, setSelectedContactName] = useState<string>('');

  // Beneficiary states
  const [showBeneficiaryModal, setShowBeneficiaryModal] = useState(false);
  const [beneficiaryData, setBeneficiaryData] = useState<BeneficiaryData | null>(null);

  const cardBg = isDark ? Palette.lighterBlack : Palette.white;
  const borderColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
  const buttonBg = isDark ? Palette.bolderBlack : '#F5F5F5';

  // Get beneficiary data from router params
  const { 
    beneficiaryCustomerId,
    beneficiaryServiceId,
    beneficiaryName
  } = useLocalSearchParams<{ 
    beneficiaryCustomerId: string;
    beneficiaryServiceId: string;
    beneficiaryName: string;
  }>();

  // Auto-populate beneficiary data if available
  useEffect(() => {
    if (beneficiaryCustomerId && beneficiaryServiceId && beneficiaryName) {
      setCustomerId(beneficiaryCustomerId);
      
      // Find and select the service
      const service = bettingServices.find(s => s.id === beneficiaryServiceId);
      if (service) {
        setSelectedService(service);
        showNotification(`Auto-filled data for ${beneficiaryName}`, 'success');
      }
    }
  }, [beneficiaryCustomerId, beneficiaryServiceId, beneficiaryName]);

  const handleCustomerIdChange = (text: string) => {
    setCustomerId(text);
    // Clear customer data when ID changes
    if (text !== customerId) {
      setCustomerData(null);
      setSelectedContactName('');
    }
  };

  const selectFromContacts = async () => {
    try {
      showNotification("Loading contacts...", "info");
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        showNotification("Accessing contacts...", "info");
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers],
        });

        showNotification("Processing contacts...", "info");
        if (data.length > 0) {
          // Create a list of contacts with phone numbers
          const contactsWithPhones = data
            .filter(contact => contact.phoneNumbers && contact.phoneNumbers.length > 0)
            .flatMap(contact =>
              contact.phoneNumbers!.map(phoneNumber => {
                const cleanPhone = phoneNumber.number?.replace(/[^0-9]/g, '') || '';
                return {
                  name: contact.name || 'Unknown',
                  phone: cleanPhone,
                  originalPhone: phoneNumber.number,
                };
              })
            )
            .filter(contact => contact.phone.length >= 10);

          setContacts(contactsWithPhones);
          setShowContactModal(true);
          showNotification(`Found ${contactsWithPhones.length} contacts`, "success");
        } else {
          showNotification('No contacts found', 'info');
        }
      } else {
        showNotification('Permission to access contacts denied', 'error');
      }
    } catch (error) {
      showNotification('Error accessing contacts', 'error');
    }
  };

  const selectContact = (contact: Contact) => {
    showNotification(`Selected ${contact.name}`, "success");
    // Store the contact name for later use
    setSelectedContactName(contact.name);
    // Use the contact's phone as customer ID (common for betting apps)
    setCustomerId(contact.phone);
    setShowContactModal(false);
  };

  const verifyCustomer = async () => {
    if (!customerId.trim()) {
      showNotification('Please enter a customer ID', 'error');
      return;
    }

    if (!selectedService) {
      showNotification('Please select a betting service', 'error');
      return;
    }    setIsVerifying(true);
    try {
      const response = await apiClient.post('/betting/verify-customer', {
        customer_id: customerId.trim(),
        service_id: selectedService.id,
      });

      if (response.success) {
        // The data is nested under response.data.data based on the log
        const customerInfo = (response.data as any)?.data || response.data;
        setCustomerData(customerInfo);
        showNotification(`Customer verified: ${customerInfo.customer_name}`, 'success');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        showNotification(response.message || 'Failed to verify customer', 'error');
      }
    } catch (error) {
      console.error('Verification error:', error);
      showNotification('Error verifying customer. Please try again.', 'error');
    } finally {
      setIsVerifying(false);
    }
  };
  const validateInput = (): boolean => {
    if (!customerId.trim()) {
      showNotification('Please enter a customer ID', 'error');
      return false;
    }

    if (!selectedService) {
      showNotification('Please select a betting service', 'error');
      return false;
    }

    if (!customerData) {
      showNotification('Please verify customer first', 'error');
      return false;
    }

    if (!amount || isNaN(Number(amount))) {
      showNotification('Please enter a valid amount', 'error');
      return false;
    }

    const amountNum = Number(amount);
    const minAmount = Math.max(100, customerData.minimum_amount); // Enforce ₦100 minimum
    
    if (amountNum < minAmount) {
      showNotification(`Amount must be at least ₦${minAmount}`, 'error');
      return false;
    }
    
    if (amountNum > customerData.maximum_amount) {
      showNotification(`Amount cannot exceed ₦${customerData.maximum_amount}`, 'error');
      return false;
    }

    return true;
  };

  const fundBettingAccount = async () => {
    if (!validateInput()) return;    setIsLoading(true);
    try {
      const response = await apiClient.post('/betting/fund', {
        customer_id: customerId.trim(),
        service_id: selectedService!.id,
        amount: amount,
      });

      if (response.success) {
        showNotification(
          `₦${amount} funded successfully to ${customerData!.customer_name} on ${selectedService!.name}`,
          'success'
        );

        // Ask to save as beneficiary
        setBeneficiaryData({
          customerId: customerId.trim(),
          serviceId: selectedService!.id,
          contactName: selectedContactName,
        });
        
        showConfirm(
          'Save Beneficiary',
          'Would you like to save this betting account as a beneficiary for future use?',
          () => {
            setShowBeneficiaryModal(true);
          },
          () => {
            setBeneficiaryData(null);
          }
        );

        // Reset form
        setCustomerId('');
        setSelectedContactName('');
        setAmount('');
        setSelectedService(null);
        setCustomerData(null);
      } else {
        showNotification(response.message || 'Failed to fund betting account', 'error');
      }
    } catch (error) {
      showNotification('Error funding betting account. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  const saveBeneficiary = (name: string) => {
    if (beneficiaryData) {
      const result = addBeneficiary({
        name,
        customerId: beneficiaryData.customerId,
        serviceId: beneficiaryData.serviceId,
        serviceType: 'betting'
      });
      
      if (result.success) {
        showNotification(result.message, 'success');
      } else {
        showNotification(result.message, 'error');
      }
      
      setBeneficiaryData(null);
    }
    setShowBeneficiaryModal(false);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Fund Betting</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>          {/* Available Balance */}
          <View style={[styles.balanceCard, { backgroundColor: cardBg }]}>
            <ThemedText style={styles.balanceLabel}>Available Balance</ThemedText>
            <ThemedText style={styles.balanceAmount}>₦{userData.amount.toLocaleString()}</ThemedText>
          </View>          {/* Betting Service Selection */}
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <ThemedText style={styles.sectionTitle}>Select Betting Service</ThemedText>
            <View style={styles.servicesGrid}>
              {bettingServices.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={[
                    styles.serviceButton,
                    { backgroundColor: buttonBg, borderColor },
                    selectedService?.id === service.id && styles.selectedService,
                  ]}
                  onPress={() => {
                    setSelectedService(service);
                    setCustomerData(null); // Clear customer data when service changes
                  }}
                >                  <View style={styles.serviceLogoContainer}>
                    {/* Use placeholder design since we don't have actual logos yet */}
                    <View style={[
                      styles.logoPlaceholder, 
                      { borderColor },
                      selectedService?.id === service.id && styles.selectedLogoPlaceholder
                    ]}>
                      <ThemedText style={[
                        styles.logoText,
                        selectedService?.id === service.id && styles.selectedLogoText
                      ]}>
                        {service.name.charAt(0)}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText
                    style={[
                      styles.serviceText,
                      selectedService?.id === service.id && styles.selectedServiceText,
                    ]}
                    numberOfLines={1}
                  >
                    {service.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Customer ID Input */}
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <View style={styles.inputHeader}>
              <ThemedText style={styles.sectionTitle}>Customer ID</ThemedText>
              <TouchableOpacity 
                style={styles.contactButton}
                onPress={selectFromContacts}
              >
                <IconSymbol name="person.circle" size={20} color={Palette.info} />
                <ThemedText style={styles.contactButtonText}>Contacts</ThemedText>
              </TouchableOpacity>
            </View>
            <ThemedTextInput
              style={styles.textInput}
              placeholder="Enter customer ID"
              value={customerId}
              onChangeText={handleCustomerIdChange}
              keyboardType="default"
            />
            
            {selectedService && customerId.trim() && !customerData && (
              <AppButton
                title={isVerifying ? "Verifying..." : "Verify Customer"}
                onPress={verifyCustomer}
                variant={isDark ? 'white' : 'dark'}
                disabled={isVerifying}
                style={styles.verifyButton}
              />
            )}
          </View>

          {/* Customer Information */}
          {customerData && (
            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <ThemedText style={styles.sectionTitle}>Customer Information</ThemedText>
              <View style={styles.customerInfo}>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Name:</ThemedText>
                  <ThemedText style={styles.infoValue}>{customerData.customer_name}</ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Username:</ThemedText>
                  <ThemedText style={styles.infoValue}>{customerData.customer_username}</ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Service:</ThemedText>
                  <ThemedText style={styles.infoValue}>{customerData.service_name}</ThemedText>
                </View>                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Min Amount:</ThemedText>
                  <ThemedText style={styles.infoValue}>₦{Math.max(100, customerData.minimum_amount)}</ThemedText>
                </View>
                <View style={styles.infoRow}>
                  <ThemedText style={styles.infoLabel}>Max Amount:</ThemedText>
                  <ThemedText style={styles.infoValue}>₦{customerData.maximum_amount}</ThemedText>
                </View>
              </View>
            </View>
          )}          {/* Amount Input */}
          {customerData && (
            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <ThemedText style={styles.sectionTitle}>Amount</ThemedText>
              <ThemedTextInput
                style={styles.textInput}
                placeholder={`₦${Math.max(100, customerData.minimum_amount)} - ₦${customerData.maximum_amount}`}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
            </View>
          )}

          {/* Fund Button */}
          {customerData && (
            <View style={styles.buttonContainer}>
              <AppButton
                title={isLoading ? "Processing..." : "Fund Account"}
                onPress={fundBettingAccount}
                disabled={isLoading || !amount.trim()}
                style={styles.fundButton}
              />
            </View>
          )}
        </ScrollView>

        {/* Contact Selection Modal */}
        <ContactSelectionModal
          visible={showContactModal}
          contacts={contacts}
          onSelectContact={selectContact}
          onClose={() => setShowContactModal(false)}
        />

        {/* Custom Alert */}
        <CustomAlert
          visible={alertState.visible}
          title={alertState.title}
          message={alertState.message}
          buttons={alertState.buttons}
          onRequestClose={hideAlert}
          icon={alertState.icon}
          iconColor={alertState.iconColor}
        />        {/* Beneficiary Name Input Alert */}
        <TextInputAlert
          visible={showBeneficiaryModal}
          title="Save Betting Beneficiary"
          message="Enter a name for this betting beneficiary:"
          placeholder="Beneficiary name"
          defaultValue={beneficiaryData?.contactName || ''}
          onConfirm={saveBeneficiary}
          onCancel={() => {
            setShowBeneficiaryModal(false);
            setBeneficiaryData(null);
          }}
        />

        
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  balanceCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
  },
  card: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },  serviceButton: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    width: (screenWidth - 80) / 3 - 8, // 3 columns with gap
    alignItems: 'center',
    minHeight: 90,
    justifyContent: 'center',
  },
  selectedService: {
    backgroundColor: Palette.info,
    borderColor: Palette.info,
  },  serviceLogoContainer: {
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },  serviceLogo: {
    width: 32,
    height: 32,
    borderRadius: 6,
    resizeMode: 'contain',
  },  logoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  selectedLogoPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'rgba(255,255,255,0.5)',
  },  logoText: {
    fontSize: 14,
    fontWeight: 'bold',
    opacity: 0.7,
  },
  selectedLogoText: {
    color: '#fff',
    opacity: 1,
  },
  serviceText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedServiceText: {
    color: '#fff',
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactButtonText: {
    color: Palette.info,
    fontSize: 14,
    fontWeight: '500',
  },
  textInput: {
    marginBottom: 16,
  },
  verifyButton: {
    marginTop: 8,
  },
  customerInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 32,
  },
  fundButton: {
    paddingVertical: 16,
  },
});
