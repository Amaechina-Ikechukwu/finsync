import { useNotification } from '@/components/InAppNotificationProvider';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';
import { useThemeColor } from '@/hooks/useThemeColor';
import { bvnService } from '@/services/apiService';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

export default function BvnEntryScreen() {
  const {  showNotification} = useNotification();
  const [bvn, setBvn] = useState('');
  const [loading, setLoading] = useState(false);
  const bgColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  const validateBvn = (bvnNumber: string) => {
    // BVN is 11 digits
    if (bvnNumber.length !== 11) {
      showNotification('BVN must be 11 digits', 'error');
      return false;
    }
    
    if (!/^\d{11}$/.test(bvnNumber)) {
      showNotification('BVN must contain only numbers', 'error');
      return false;
    }
    
    return true;
  };

  const handleContinue = async () => {
    if (!bvn.trim()) {
      showNotification('Please enter your BVN', 'error');
      return;
    }

    if (!validateBvn(bvn)) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await bvnService.start({ bvn });
      
      if (response.success && response.data) {
        showNotification(response.message || 'BVN verification started', 'success');
        // Navigate to phone verification screen with BVN data
        router.push({
          pathname: '/auth/bvn-phone',
          params: { 
            bvn: bvn,
            sessionId: response.data.sessionId,
            maskedPhone: response.data.maskedPhone || `********${response.data.lastThree ?? ''}`,
            name: response.data.name,
            message: response.message || ''
          }
        });
      } else {
        showNotification(response.message || 'BVN verification failed', 'error');
      }
    } catch (error: any) {
      console.error('BVN verification error:', error);
      showNotification(error.message || 'An error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBvnChange = (text: string) => {
    // Only allow numbers and limit to 11 characters
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 11) {
      setBvn(numericText);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: bgColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      
      <ThemedView style={styles.inner}>
        <View style={styles.header}>
          <ThemedText type="title" style={[styles.title, { color: textColor }]}>
            Enter your BVN
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: textColor }]}>
            We need to verify your Bank Verification Number (BVN) to secure your account
          </ThemedText>
        </View>

        <View style={styles.form}>
          <ThemedTextInput
            placeholder="Enter 11-digit BVN"
            value={bvn}
            onChangeText={handleBvnChange}
            keyboardType="numeric"
            maxLength={11}
            autoCapitalize="none"
            style={styles.input}
          />
          
          <View style={styles.infoBox}>
            <ThemedText style={[styles.infoText, { color: textColor }]}>
              Your BVN is used only for verification purposes and is kept secure
            </ThemedText>
          </View>

          <AppButton
            title={loading ? 'Verifying...' : 'Continue'}
            onPress={handleContinue}
            loading={loading}
            disabled={loading || bvn.length !== 11}
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
    width:'100%'
  },
  inner: {
    width: '100%',
    // maxWidth: 400,
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
    letterSpacing: 2,
  },
  infoBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
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
