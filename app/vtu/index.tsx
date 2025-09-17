import * as Contacts from 'expo-contacts';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
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
import { vtuService } from '@/services/apiService';
import { useAppStore } from '@/store';

interface Network {
  id: string;
  name: string;
  minAmount: number;
  color: string;
}

interface Contact {
  name: string;
  phone: string;
}

const networks: Network[] = [
  { id: 'mtn', name: 'MTN', minAmount: 10, color: '#FFCB05' },
  { id: 'glo', name: 'GLO', minAmount: 50, color: '#00A651' },
  { id: 'airtel', name: 'AIRTEL', minAmount: 50, color: '#E60012' },
  { id: '9mobile', name: '9MOBILE', minAmount: 50, color: '#00A86B' },
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

export default function BuyAirtime() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { showNotification } = useNotification();
  const { userData, addBeneficiary, updateBalance } = useAppStore();
  const { alertState, hideAlert, showConfirm } = useCustomAlert();
    const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactName, setSelectedContactName] = useState<string>('');
  const [showBeneficiaryModal, setShowBeneficiaryModal] = useState(false);
  const [beneficiaryData, setBeneficiaryData] = useState<{ phone: string; network: string; contactName?: string } | null>(null);
  
  const cardBg = isDark ? Palette.lighterBlack : Palette.white;
  const borderColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
  const buttonBg = isDark ? Palette.bolderBlack : '#F5F5F5';

  const detectNetwork = (phone: string): Network | null => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    
    // MTN prefixes
    if (/^(0803|0806|0703|0706|0813|0816|0810|0814|0903|0906|0913|0916|070[23]|080[367]|081[0346]|090[356]|091[36])/.test(cleanPhone)) {
      return networks.find(n => n.id === 'mtn') || null;
    }
    
    // GLO prefixes  
    if (/^(0805|0807|0811|0815|0905|0915|070[15]|080[57]|081[15]|090[5]|091[5])/.test(cleanPhone)) {
      return networks.find(n => n.id === 'glo') || null;
    }
    
    // AIRTEL prefixes
    if (/^(0802|0808|0812|0701|0708|0901|0902|0904|0907|0912|070[18]|080[28]|081[2]|090[124]|091[2])/.test(cleanPhone)) {
      return networks.find(n => n.id === 'airtel') || null;
    }
    
    // 9MOBILE prefixes
    if (/^(0809|0817|0818|0909|0908|080[9]|081[78]|090[89])/.test(cleanPhone)) {
      return networks.find(n => n.id === '9mobile') || null;
    }
    
    return null;
  };
  const handlePhoneChange = (text: string) => {
    setPhoneNumber(text);
    // Clear selected contact name when manually typing
    if (text !== phoneNumber) {
      setSelectedContactName('');
    }
    const detected = detectNetwork(text);
    if (detected && detected.id !== selectedNetwork?.id) {
      setSelectedNetwork(detected);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };const selectFromContacts = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers],
        });
        
        if (data.length > 0) {
          // Create a list of contacts with phone numbers
          const contactsWithPhones = data
            .filter(contact => contact.phoneNumbers && contact.phoneNumbers.length > 0)
            .flatMap(contact => 
              contact.phoneNumbers!.map(phone => ({
                name: contact.name || 'Unknown',
                phone: phone.number || ''
              }))
            )
            .filter(contact => contact.phone.trim() !== '');

          if (contactsWithPhones.length === 0) {
            showNotification('No contacts with phone numbers found', 'error');
            return;
          }

          setContacts(contactsWithPhones);
          setShowContactModal(true);
        } else {
          showNotification('No contacts found', 'error');
        }
      } else {
        showNotification('Permission to access contacts denied', 'error');
      }
    } catch (error) {
      showNotification('Error accessing contacts', 'error');
    }
  };
  const selectContact = (contact: Contact) => {
    // Store the contact name for later use
    setSelectedContactName(contact.name);
    const cleanPhone = contact.phone.replace(/[^0-9]/g, '');
    setPhoneNumber(cleanPhone);
    const detected = detectNetwork(cleanPhone);
    if (detected) {
      setSelectedNetwork(detected);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowContactModal(false);
  };

  const validateInput = (): boolean => {
    if (!phoneNumber || phoneNumber.length < 11) {
      showNotification('Please enter a valid phone number', 'error');
      return false;
    }
    
    if (!selectedNetwork) {
      showNotification('Please select a network', 'error');
      return false;
    }
    
    const amountNum = parseInt(amount);
    if (!amount || amountNum < selectedNetwork.minAmount) {
      showNotification(`Minimum amount for ${selectedNetwork.name} is ₦${selectedNetwork.minAmount}`, 'error');
      return false;
    }
    
    if (amountNum > userData.amount) {
      showNotification('Insufficient balance', 'error');
      return false;
    }
    
    return true;
  };

  const handlePurchase = async () => {
    if (!validateInput()) return;
    
    setIsLoading(true);
    
    try {
      const response = await vtuService.buyAirtime({
        phone: phoneNumber,
        amount: amount,
        network_id: selectedNetwork!.id
      });      if (response.success && response.data) {
        // Handle potential double-nested response structure
        const data = (response.data as any).data || response.data;
        
        // Update balance with final balance from API
        if (data.final_balance) {
          updateBalance(parseFloat(data.final_balance));
        }
          showNotification(
          `Airtime purchase successful! ₦${data.amount} sent to ${data.phone}`,
          'success'
        );
        
        // Ask to save as beneficiary
        setBeneficiaryData({ 
          phone: data.phone, 
          network: selectedNetwork!.name,
          contactName: selectedContactName 
        });
        showConfirm(
          'Save Beneficiary',
          'Would you like to save this number as a beneficiary for future use?',
          () => {
            setShowBeneficiaryModal(true);
          },
          () => {
            setBeneficiaryData(null);
          }
        );
        
        // Reset form
        setPhoneNumber('');
        setAmount('');
        setSelectedNetwork(null);
        
      } else {
        showNotification(response.error || 'Purchase failed', 'error');
      }
    } catch (error) {
      showNotification('Network error occurred', 'error');
    } finally {
      setIsLoading(false);
    }  };
  const saveBeneficiary = (name: string) => {
    if (beneficiaryData) {      const result = addBeneficiary({ 
        name, 
        phone: beneficiaryData.phone, 
        network: beneficiaryData.network,
        serviceType: 'vtu'
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color={isDark ? Palette.white : Palette.black} />
          </TouchableOpacity>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            Buy Airtime
          </ThemedText>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Balance Card */}
          <View style={[styles.balanceCard, { backgroundColor: cardBg }]}>            <ThemedText style={styles.balanceLabel}>Available Balance</ThemedText>            <ThemedText type="title" style={styles.balanceAmount}>
              ₦{userData.amount.toLocaleString()}
            </ThemedText>
          </View>          {/* Phone Number Input */}
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <ThemedText style={styles.cardTitle}>Phone Number</ThemedText>
            <View style={styles.phoneInputContainer}>
              <ThemedTextInput
                style={styles.phoneInput}
                placeholder="Enter phone number"
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                maxLength={11}
              />              <TouchableOpacity
                style={styles.contactButton}
                onPress={selectFromContacts}
              >
                <IconSymbol name="person.circle" size={24} color={Palette.info} />
              </TouchableOpacity>
            </View>
          </View>          {/* Network Selection */}
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <ThemedText style={styles.cardTitle}>Select Network</ThemedText>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.networkScrollView}
              contentContainerStyle={styles.networkScrollContent}
            >              {networks.map((network) => (
                <TouchableOpacity
                  key={network.id}
                  style={[
                    styles.networkButton,
                    { 
                      backgroundColor: selectedNetwork?.id === network.id ? network.color : getLighterColor(network.color),
                      borderColor: selectedNetwork?.id === network.id ? network.color : 'transparent'
                    }
                  ]}
                  onPress={() => {
                    setSelectedNetwork(network);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <ThemedText 
                    style={[
                      styles.networkText,
                      { 
                        color: selectedNetwork?.id === network.id ? Palette.white : network.color
                      }
                    ]}
                  >
                    {network.name}
                  </ThemedText>
                  <ThemedText 
                    style={[
                      styles.minAmountText,
                      { 
                        color: selectedNetwork?.id === network.id ? Palette.white : network.color
                      }
                    ]}
                  >
                    Min: ₦{network.minAmount}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>          {/* Amount Input */}
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <ThemedText style={styles.cardTitle}>Amount</ThemedText>
            <ThemedTextInput
              style={styles.amountInput}
              placeholder={`Minimum ₦${selectedNetwork?.minAmount || 10}`}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          </View>          {/* Purchase Button */}          <AppButton
            title={isLoading ? 'Processing...' : 'Buy Airtime'}
            onPress={handlePurchase}
            disabled={isLoading}
            style={styles.purchaseButton}
          />
        </ScrollView>        {/* Contact Selection Modal */}
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
          title="Save Beneficiary"
          message="Enter a name for this beneficiary:"
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  balanceCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },  phoneInput: {
    flex: 1,
    marginRight: 12,
  },
  contactButton: {
    padding: 12,
  },
  networkScrollView: {
    marginHorizontal: -20,
  },
  networkScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  networkButton: {
    minWidth: 120,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  networkText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },  minAmountText: {
    fontSize: 12,
  },
  amountInput: {
    width: '100%',
  },  purchaseButton: {
    marginBottom: 40,
  },
});
