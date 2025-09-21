import { useNotification } from '@/components/InAppNotificationProvider';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';
import { useThemeColor } from '@/hooks/useThemeColor';
import { bvnService } from '@/services/apiService';
import { useAppStore } from '@/store/appStore';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function BvnOtpScreen() {
  const { bvn, phoneNumber, sessionId, otpId: initialOtpId } = useLocalSearchParams<{ bvn: string; phoneNumber: string; sessionId: string; otpId?: string }>();
  const {  showNotification} = useNotification();
  const { markBvnVerified } = useAppStore();
  const [otp, setOtp] = useState('');
  const [otpId, setOtpId] = useState<string | undefined>(initialOtpId);
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

    if (!otpId) {
      showNotification('Missing OTP reference. Please resend OTP.', 'error');
      return;
    }

    setLoading(true);
    
    try {
      const resp = await bvnService.verifyOtp({ otpCode: otp, otpId });
      console.log(JSON.stringify(resp,null,2))
      const verified = resp.data?.verified === true || resp.data?.verification?.bvnVerified === true;
      if (resp.success && verified) {
        await markBvnVerified();
        showNotification(resp.message || 'BVN verified successfully!', 'success');
        router.replace('/auth/pin-setup');
      } else {
        showNotification(resp.message || 'Invalid OTP. Please try again.', 'error');
      }
    } catch (error: any) {
      showNotification(error.message || 'Invalid OTP. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!sessionId) return;
    setResendLoading(true);
    
    try {
      const resp = await bvnService.resendOtp({ sessionId: String(sessionId) });
      if (resp.success && resp.data) {
        setOtpId(resp.data.otpId);
        showNotification(resp.data.message || 'OTP resent successfully', 'success');
        setCountdown(60);
        setCanResend(false);
      } else {
        showNotification(resp.message || 'Failed to resend OTP. Please try again.', 'error');
      }
    } catch (error: any) {
      showNotification(error.message || 'Failed to resend OTP. Please try again.', 'error');
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
            We've sent a 6-digit code to {formatPhoneNumber(String(phoneNumber) || '')}
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
