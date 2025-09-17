import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Alert, Animated, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

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

interface AccountDetailsModalProps {
  userData: UserData;
  showAccountDetails: boolean;
  onClose: () => void;
}

export default function AccountDetailsModal({ userData, showAccountDetails, onClose }: AccountDetailsModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied!', `${label} copied to clipboard`);
  };



  if (!showAccountDetails) return null;

  return (
    <Animated.View style={styles.accountDetailsCard}>
      <LinearGradient
        colors={isDark 
          ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] 
          : ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']
        }
        style={styles.detailsGradient}
      >
        <View style={styles.detailsHeader}>
          <ThemedText type="subtitle" style={styles.detailsTitle}>Account Details</ThemedText>
          <TouchableOpacity onPress={onClose}>
            <IconSymbol name="xmark.circle.fill" size={24} color={isDark ? Palette.white : Palette.black} />
          </TouchableOpacity>
        </View>
          <View style={styles.detailsContent}>
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Full Name</ThemedText>
            <TouchableOpacity 
              onPress={() => copyToClipboard(userData.fullname, 'Full name')}
              style={styles.detailValueContainer}
            >
              <ThemedText style={styles.detailValue}>{userData.fullname}</ThemedText>
              <IconSymbol name="doc.on.doc" size={14} color={isDark ? Palette.white : Palette.black} />
            </TouchableOpacity>
          </View>

          {userData.email && (
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Email</ThemedText>
              <TouchableOpacity 
                onPress={() => copyToClipboard(userData.email!, 'Email')}
                style={styles.detailValueContainer}
              >
                <ThemedText style={styles.detailValue}>{userData.email}</ThemedText>
                <IconSymbol name="doc.on.doc" size={14} color={isDark ? Palette.white : Palette.black} />
              </TouchableOpacity>
            </View>
          )}

          {userData.phone && (
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Phone</ThemedText>
              <TouchableOpacity 
                onPress={() => copyToClipboard(userData.phone!, 'Phone number')}
                style={styles.detailValueContainer}
              >
                <ThemedText style={styles.detailValue}>{userData.phone}</ThemedText>
                <IconSymbol name="doc.on.doc" size={14} color={isDark ? Palette.white : Palette.black} />
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Bank Name</ThemedText>
            <TouchableOpacity 
              onPress={() => copyToClipboard(userData.bank_name, 'Bank name')}
              style={styles.detailValueContainer}
            >
              <ThemedText style={styles.detailValue}>{userData.bank_name}</ThemedText>
              <IconSymbol name="doc.on.doc" size={14} color={isDark ? Palette.white : Palette.black} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Account Number</ThemedText>
            <TouchableOpacity 
              onPress={() => copyToClipboard(`${userData.account_number} \n ${userData.fullname}`, 'Account number')}
              style={styles.detailValueContainer}
            >
              <ThemedText style={styles.detailValue}>{userData.account_number}</ThemedText>
              <IconSymbol name="doc.on.doc" size={14} color={isDark ? Palette.white : Palette.black} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.detailRow}>
            <ThemedText style={styles.detailLabel}>Routing Number</ThemedText>
            <TouchableOpacity 
              onPress={() => copyToClipboard(userData.routingNumber, 'Routing number')}
              style={styles.detailValueContainer}
            >
              <ThemedText style={styles.detailValue}>{userData.routingNumber}</ThemedText>
              <IconSymbol name="doc.on.doc" size={14} color={isDark ? Palette.white : Palette.black} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  accountDetailsCard: {
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  detailsGradient: {
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  detailsContent: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  detailLabel: {
    fontSize: 14,
    opacity: 0.7,
    fontWeight: '500',
  },
  detailValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});
