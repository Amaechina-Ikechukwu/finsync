import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Alert, Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
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

interface BalanceCardProps {
  userData: UserData;
  balanceVisible: boolean;
  onToggleBalance: () => void;
  scaleAnim: Animated.Value;
}

export default function BalanceCard({ userData, balanceVisible, onToggleBalance, scaleAnim }: BalanceCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [showAccountModal, setShowAccountModal] = useState(false);

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied!', `${label} copied to clipboard`);
  };

  return (
    <Animated.View style={[styles.cardContainer, { transform: [{ scale: scaleAnim }] }]}>
      <View style={[styles.glassCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)' }]}>
        <LinearGradient
          colors={isDark 
            ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0.05)'] 
            : ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,0.9)']
          }
          style={styles.gradientOverlay}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardContent}>
            <View style={styles.balanceHeader}>
              <View>
                <ThemedText type="default" style={styles.balanceLabel}>
                  Total Balance
                </ThemedText>
                {/* Account type */}
                {/* <ThemedText style={styles.accountTypeText}>
                  {userData.accountType}
                </ThemedText> */}
              </View>
              <TouchableOpacity onPress={onToggleBalance} style={styles.eyeButton}>
                <IconSymbol 
                  name={balanceVisible ? "eye.fill" : "eye.slash.fill"} 
                  size={24} 
                  color={isDark ? Palette.white : Palette.black} 
                />
              </TouchableOpacity>
            </View>       
                 <TouchableOpacity onPress={onToggleBalance} activeOpacity={0.8}>
              <ThemedText type="title" style={styles.balanceAmount}>
                {balanceVisible ? `₦${(userData.amount || 0).toLocaleString()}` : '••••••••'}
              </ThemedText>
            </TouchableOpacity>
       
            
            <View style={styles.cardActions}>
              <TouchableOpacity style={[styles.actionButton, {backgroundColor:isDark?Palette.white:Palette.black}]} onPress={() => router.push("/transfers")}>
                <IconSymbol name="plus.circle.fill" size={20} color={isDark?Palette.black:Palette.white} />
                <Text style={[styles.actionText,{color:isDark?Palette.black:Palette.white }]}>Send Money</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.secondaryButton, {backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}]} 
                onPress={() => setShowAccountModal(true)}
              >
                <IconSymbol name="info.circle" size={20} color={isDark ? Palette.white : Palette.black} />
                <Text style={[styles.actionText, {color: isDark ? Palette.white : Palette.black}]}>Account Info</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Account Details Modal */}
      <Modal
        visible={showAccountModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAccountModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1a1a1a' : 'white' }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle" style={styles.modalTitle}>Account Information</ThemedText>
              <TouchableOpacity onPress={() => setShowAccountModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={24} color={isDark ? Palette.white : Palette.black} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Account Holder</ThemedText>
                <ThemedText style={styles.infoValue}>{userData.fullname}</ThemedText>
              </View>
              
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Account Number</ThemedText>
                <ThemedText style={styles.infoValue}>{userData.account_number}</ThemedText>
              </View>
              
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Bank Name</ThemedText>
                <ThemedText style={styles.infoValue}>{userData.bank_name}</ThemedText>
              </View>
              
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>Account Status</ThemedText>
                <ThemedText style={[styles.infoValue, { color: userData.account_status === 'ACTIVE' ? '#4CAF50' : '#FF9800' }]}>
                  {userData.account_status}
                </ThemedText>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.copyButton, { backgroundColor: isDark ? Palette.white : Palette.black }]}
              onPress={() => {
                copyToClipboard(`${userData.fullname}\n${userData.account_number}\n${userData.bank_name}`, 'Account Details');
                setShowAccountModal(false);
              }}
            >
              <IconSymbol name="doc.on.doc" size={20} color={isDark ? Palette.black : Palette.white} />
              <Text style={[styles.copyButtonText, { color: isDark ? Palette.black : Palette.white }]}>Copy All Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    paddingHorizontal: 20,
  
  },
  glassCard: {
    borderRadius: 28,
    overflow: 'hidden',
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 8 },
    // shadowOpacity: 0.1,
    // shadowRadius: 20,
    // elevation: 8,
    // borderWidth: 1,
    // borderColor: 'rgba(255,255,255,0.1)',
  },
  gradientOverlay: {
    borderRadius: 28,
  },
  cardContent: {
    padding: 32,
    gap:20
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',

  },
  balanceLabel: {
    fontSize: 16,
    opacity: 0.8,
    fontWeight: '600',
  },
  accountTypeText: {
    fontSize: 14,
    opacity: 0.6,
  
  },
  eyeButton: {
    padding: 8,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: '900',
   lineHeight:50,
    letterSpacing: -1,
  },
  accountNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
 
   
    
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  accountNumber: {
    fontSize: 16,
    opacity: 0.8,
  
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 24,
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },

  secondaryButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  actionText: {
    fontWeight: '700',
    fontSize: 16,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  
  modalBody: {
    gap: 16,
    marginBottom: 24,
  },
  
  infoRow: {
    gap: 4,
  },
  
  infoLabel: {
    fontSize: 14,
    opacity: 0.7,
    fontWeight: '600',
  },
  
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
  },
  
  copyButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
