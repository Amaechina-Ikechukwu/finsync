import FeatureBannerCarousel from '@/components/home/FeatureBannerCarousel';
import * as Haptics from 'expo-haptics';
import type { Href } from 'expo-router';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, RefreshControl, ScrollView, StyleSheet } from 'react-native';

import { useNotification } from '@/components/InAppNotificationProvider';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import TransactionPinGuard from '@/components/TransactionPinGuard';
import AccountDetailsModal from '@/components/home/AccountDetailsModal';
import BalanceCard from '@/components/home/BalanceCard';
import Header from '@/components/home/Header';
import QuickActions from '@/components/home/QuickActions';
import SavedBeneficiaries from '@/components/home/SavedBeneficiaries';
import TransactionsList from '@/components/home/TransactionsList';
import HomeSkeleton from '@/components/ui/HomeSkeleton';
import { Palette } from '@/constants/Colors';
import { auth } from '@/firebase';
import { useColorScheme } from '@/hooks/useColorScheme';
import { accountService, referralService } from '@/services/apiService';
import { useAppStore } from '@/store';
import { Pressable, TextInput, View } from 'react-native';


// Function to generate avatar from initials
const generateAvatarGradient = (name: string) => {
  // Handle null/undefined names
  if (!name || name.trim() === "") {
    return { 
      initials: "U", 
      gradientColors: ['#667eea', '#764ba2'] as [string, string] 
    };
  }
  
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  const colors = [
    ['#667eea', '#764ba2'],
    ['#f093fb', '#f5576c'],
    ['#4facfe', '#00f2fe'],
    ['#43e97b', '#38f9d7'],
    ['#fa709a', '#fee140'],
    ['#a8edea', '#fed6e3'],
    ['#ff9a9e', '#fecfef'],
    ['#ffecd2', '#fcb69f'],
  ];
  const colorIndex = name.length % colors.length;
  return { initials, gradientColors: colors[colorIndex] as [string, string] };
};

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [kycBannerVisible, setKycBannerVisible] = useState(false);
  const [referralBannerVisible, setReferralBannerVisible] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [submittingReferral, setSubmittingReferral] = useState(false);
  const { showNotification } = useNotification();
  
  // Zustand store
  const { userData, transactions, beneficiaries, isLoading, isRefreshing, hasInitiallyFetched, fetchData } = useAppStore();
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const avatarData = generateAvatarGradient(userData.fullname);

  // Fetch data on component mount only if not already loading or fetched
  useEffect(() => {
    if (!isLoading && !hasInitiallyFetched) {
      fetchData();
    }
  }, [isLoading,hasInitiallyFetched]);

  // Fetch identity status for banner
  useEffect(() => {
    (async () => {
      const res = await accountService.getIdentityStatus();
      if (res.success && res.data) {
        setKycBannerVisible(!res.data.submitted);
      }
    })();
  }, []);

  // Also hide referral banner if user already has an app/referral code applied
  useEffect(() => {
    if (userData?.hasAppCode) {
      setReferralBannerVisible(false);
    }
  }, [userData?.hasAppCode]);

  // Gate referral banner: only show for users created within the last 7 days
  useEffect(() => {
    try {
      const currentUser = auth.currentUser;
      const creationTime = currentUser?.metadata?.creationTime;
      if (!creationTime) {
        // If we cannot determine creation time, do not show the referral banner
        setReferralBannerVisible(false);
        return;
      }
      const createdAtMs = new Date(creationTime).getTime();
      const ageMs = Date.now() - createdAtMs;
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      if (ageMs > sevenDaysMs) {
        setReferralBannerVisible(false);
      }
    } catch (e) {
      // On any error determining age, hide the banner
      setReferralBannerVisible(false);
    }
  }, []);
  useEffect(()=>{
    const logIdToken = async () => {
      try {
        const { auth } = await import('@/firebase');
        const currentUser = auth.currentUser;
        if (currentUser) {
          const token = await currentUser.getIdToken();
          // console.log('🔑 Firebase ID Token:', token);

        } else {
          console.log('❌ No authenticated user found');
        }
      } catch (error) {
        console.error('❌ Error getting ID token:', error);
      }
    };
    
    logIdToken();
  },[userData])

  // Entrance animations - only run after loading is complete
  useEffect(() => {
    if (!isLoading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isLoading]);

  const toggleBalanceVisibility = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBalanceVisible(!balanceVisible);
  };

  const handleRefresh = async () => {
     fetchData();
  };

  const handleCryptoPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/crypto/native');
  };

  if (isLoading || userData==null) {
    return <HomeSkeleton />;
  }

  return (
    <TransactionPinGuard>
      <ThemedView>
        <ScrollView 
          style={[styles.container, { backgroundColor: 'transparent' }]} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={isDark ? '#fff' : '#000'}
            />
          }
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }],gap:60 }}>
            <Header 
              userData={userData}
              avatarData={avatarData}
              onAvatarPress={() => router.push('/settings' as Href)}
            />

            {kycBannerVisible && (
              <View style={{
                marginHorizontal: 16,
                padding: 12,
                borderRadius: 12,
                backgroundColor: Palette.warning + '22',
                borderWidth: 1,
                borderColor: Palette.warning + '55',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ fontWeight: '600', color: Palette.warning }}>Complete your KYC</ThemedText>
                  <ThemedText style={{ color: '#666' }}>Verify your identity to unlock all features.</ThemedText>
                </View>
                <Pressable
                  onPress={() => router.push('/settings/kyc-nin' as Href)}
                  style={{
                    backgroundColor: Palette.warning,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                  }}
                >
                  <ThemedText style={{ color: '#fff', fontWeight: '600' }}>Start</ThemedText>
                </Pressable>
                <Pressable onPress={() => setKycBannerVisible(false)}>
                  <ThemedText style={{ color: '#666' }}>Dismiss</ThemedText>
                </Pressable>
              </View>
            )}
           

            {referralBannerVisible && (
              <View style={{
                marginHorizontal: 16,
                padding: 14,
                borderRadius: 12,
                backgroundColor: '#ECFDF5', // green-50
                borderWidth: 1,
                borderColor: '#A7F3D0', // green-200
                gap: 10,
              }}>
                <ThemedText style={{ fontWeight: '700', color: '#065F46' }}>Have a referral code?</ThemedText>
                <ThemedText style={{ color: '#065F46' }}>Use it and earn ₦50 instantly.</ThemedText>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <View style={{ flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1FAE5', borderRadius: 10 }}>
                    <TextInput
                      placeholder="Enter code"
                      value={referralCode}
                      onChangeText={setReferralCode}
                      autoCapitalize="characters"
                      style={{ paddingHorizontal: 12, paddingVertical: 10 }}
                    />
                  </View>
                  <Pressable
                    onPress={async () => {
                      if (!referralCode.trim()) return showNotification('Enter a code first', 'info');
                      if (submittingReferral) return;
                      setSubmittingReferral(true);
                      try {
                        const res = await referralService.applyCode(referralCode.trim());
                        if (res.success) {
                          showNotification(res.message || 'Referral applied! ₦50 added.', 'success');
                          setReferralBannerVisible(false);
                        } else {
                          showNotification(res.message || 'Unable to apply referral code', 'error');
                        }
                      } catch (e) {
                        showNotification('Network error', 'error');
                      } finally {
                        setSubmittingReferral(false);
                      }
                    }}
                    style={{
                      backgroundColor: '#10B981',
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 10,
                      opacity: submittingReferral ? 0.7 : 1,
                    }}
                  >
                    <ThemedText style={{ color: '#fff', fontWeight: '700' }}>{submittingReferral ? 'Applying…' : 'Apply'}</ThemedText>
                  </Pressable>
                  <Pressable onPress={() => setReferralBannerVisible(false)} style={{ paddingHorizontal: 8, paddingVertical: 10 }}>
                    <ThemedText style={{ color: '#065F46' }}>Dismiss</ThemedText>
                  </Pressable>
                </View>
              </View>
            )}

            <BalanceCard 
              userData={userData}
              balanceVisible={balanceVisible}
              onToggleBalance={toggleBalanceVisibility}
              scaleAnim={scaleAnim}
            />

            {/* Feature Banner Carousel */}
            <FeatureBannerCarousel />

            {/* <DebugPanel /> */}
{/* <DataWipeDemo/> */}
            <AccountDetailsModal 
              userData={userData}
              showAccountDetails={showAccountDetails}
              onClose={() => setShowAccountDetails(false)}
            />

            {/* <RevenueChart />

            <FinancialCharts />

            <WeeklySummary weeklyStats={weeklyStats} /> */}

            <SavedBeneficiaries 
              beneficiaries={beneficiaries} 
              onBeneficiaryPress={(beneficiary) => {
                // Handle beneficiary press - could navigate to respective service screen
              }} 
            />

            <TransactionsList transactions={transactions} />

            <QuickActions  />
          </Animated.View>
        </ScrollView>
      </ThemedView>
    </TransactionPinGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
});
