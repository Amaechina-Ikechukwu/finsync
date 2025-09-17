import { useNotification } from '@/components/InAppNotificationProvider';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';
import { useThemeColor } from '@/hooks/useThemeColor';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

export default function BvnPhoneScreen() {
  const { bvn, sessionId, maskedPhone, name,message } = useLocalSearchParams<{ 
    bvn: string; 
    sessionId: string; 
    maskedPhone: string; 
    name: string;
     message:string
  }>();
  const { showNotification } = useNotification();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const bgColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  const validatePhoneNumber = (phone: string) => {
    // Nigerian phone number validation
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    
    if (cleanPhone.length < 11) {
      showNotification('Please enter a valid 11-digit phone number', 'error');
      return false;
    }
    
    if (cleanPhone.length > 11) {
      showNotification('Phone number cannot exceed 11 digits', 'error');
      return false;
    }
    
    if (!cleanPhone.startsWith('0')) {
      showNotification('Phone number must start with 0', 'error');
      return false;
    }
    
    return true;
  };

  const handleContinue = async () => {
    if (!phoneNumber.trim()) {
      showNotification('Please enter your phone number', 'error');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      return;
    }

    setLoading(true);
    
    try {
      // Simulate API call to verify phone number against BVN
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      showNotification('OTP sent to your phone number', 'success');
      
      // Navigate to OTP verification screen
      router.push({
        pathname: '/auth/bvn-otp',
        params: { 
          bvn, 
          sessionId,
          phoneNumber: phoneNumber.replace(/[^0-9]/g, ''),
          name
        }
      });
    } catch (error) {
      showNotification('Failed to verify phone number. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (text: string) => {
    // Format phone number as user types
    const cleanText = text.replace(/[^0-9]/g, '');
    if (cleanText.length <= 11) {
      setPhoneNumber(cleanText);
    }
  };

  const formatPhoneDisplay = (phone: string) => {
    // Format as 0XXX XXX XXXX
    if (phone.length >= 4) {
      return phone.substring(0, 4) + ' ' + phone.substring(4, 7) + ' ' + phone.substring(7);
    }
    return phone;
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: bgColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView style={styles.inner}>
        <View style={styles.header}>
          <ThemedText type="subtitle" style={[styles.title, { color: textColor,fontSize:20 }]}>
            Verify Phone Number
          </ThemedText>
           <ThemedText type="defaultSemiBold" style={[styles.title, { color: textColor,lineHeight:50 }]}>
            Are you {name}?
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: textColor }]}>
            Enter the phone number linked to your BVN which ends in <ThemedText type="defaultSemiBold" style={[styles.title, { color: textColor,lineHeight:50,fontSize:20 }]}>{maskedPhone}.</ThemedText>  We'll send you an OTP for verification.
          </ThemedText>
        </View>

        <View style={styles.form}>
          <ThemedTextInput
            placeholder="Enter phone number (e.g., 08012345678)"
            value={formatPhoneDisplay(phoneNumber)}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
            maxLength={13} // Accounting for spaces in formatting
            autoCapitalize="none"
            style={styles.input}
          />
          
          <View style={styles.infoBox}>
            <ThemedText style={[styles.infoText, { color: textColor }]}>
              Make sure this is the phone number registered with your BVN
            </ThemedText>
          </View>

          <AppButton
            title={loading ? 'Sending OTP...' : 'Send OTP'}
            onPress={handleContinue}
            loading={loading}
            disabled={loading || phoneNumber.length !== 11}
            style={styles.button}
          />
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: 400,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Belgrano-Regular',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 24,
    fontFamily: 'Belgrano-Regular',
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 20,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 1,
  },
  infoBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    opacity: 0.8,
  },
  button: {
    width: '100%',
    borderRadius: 20,
  },
});
