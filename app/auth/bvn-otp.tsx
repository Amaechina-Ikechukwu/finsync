import { useNotification } from '@/components/InAppNotificationProvider';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAppStore } from '@/store/appStore';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function BvnOtpScreen() {
  const { bvn, phoneNumber } = useLocalSearchParams<{ bvn: string; phoneNumber: string }>();
  const {  showNotification} = useNotification();
  const { markBvnVerified } = useAppStore();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const bgColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const validateOtp = (otpCode: string) => {
    if (otpCode.length !== 6) {
      showNotification('OTP must be 6 digits', 'error');
      return false;
    }
    
    if (!/^\d{6}$/.test(otpCode)) {
      showNotification('OTP must contain only numbers', 'error');
      return false;
    }
    
    return true;
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      showNotification('Please enter the OTP', 'error');
      return;
    }

    if (!validateOtp(otp)) {
      return;
    }

    setLoading(true);
    
    try {
      // Simulate API call to verify OTP
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mark BVN as verified in the store
      await markBvnVerified();
      
      showNotification('BVN verified successfully!', 'success');
      
      // Navigation will be handled by the main layout
      // The layout will automatically redirect to pin-setup
    } catch (error) {
      showNotification('Invalid OTP. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    
    try {
      // Simulate API call to resend OTP
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showNotification('OTP resent successfully', 'success');
      setCountdown(60);
      setCanResend(false);
    } catch (error) {
      showNotification('Failed to resend OTP. Please try again.', 'error');
    } finally {
      setResendLoading(false);
    }
  };

  const handleOtpChange = (text: string) => {
    // Only allow numbers and limit to 6 characters
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 6) {
      setOtp(numericText);
    }
  };

  const formatPhoneNumber = (phone: string) => {
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
          <ThemedText type="title" style={[styles.title, { color: textColor }]}>
            Enter OTP
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: textColor }]}>
            We've sent a 6-digit code to {formatPhoneNumber(phoneNumber || '')}
          </ThemedText>
        </View>

        <View style={styles.form}>
          <ThemedTextInput
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChangeText={handleOtpChange}
            keyboardType="numeric"
            maxLength={6}
            autoCapitalize="none"
            style={styles.input}
            autoFocus
          />
          
          <View style={styles.otpInfo}>
            <ThemedText style={[styles.otpText, { color: textColor }]}>
              Didn't receive the code?
            </ThemedText>
            
            {canResend ? (
              <TouchableOpacity onPress={handleResendOtp} disabled={resendLoading}>
                <ThemedText style={[styles.resendText, { color: '#3B82F6' }]}>
                  {resendLoading ? 'Resending...' : 'Resend OTP'}
                </ThemedText>
              </TouchableOpacity>
            ) : (
              <ThemedText style={[styles.countdownText, { color: textColor }]}>
                Resend in {countdown}s
              </ThemedText>
            )}
          </View>

          <AppButton
            title={loading ? 'Verifying...' : 'Verify OTP'}
            onPress={handleVerifyOtp}
            loading={loading}
            disabled={loading || otp.length !== 6}
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
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
    fontWeight: 'bold',
  },
  otpInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  otpText: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.8,
  },
  resendText: {
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  countdownText: {
    fontSize: 14,
    opacity: 0.6,
  },
  button: {
    width: '100%',
    borderRadius: 20,
  },
});
