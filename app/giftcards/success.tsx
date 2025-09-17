import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GiftCardSuccessScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams();
  // Expect params: { amount, currency, productName, orderId }
  const { amount, currency, productName, orderId,transactionId } = params || {};

  const cardBg = isDark ? Palette.lighterBlack : Palette.white;
  const textColor = isDark ? Palette.white : Palette.black;
  const secondaryTextColor = isDark ? Palette.gray : '#6b7280';

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  const handleNewPurchase = () => {
    router.push('/giftcards');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.placeholder} />
          <ThemedText style={[styles.headerTitle, { color: textColor }]}>Success</ThemedText>
          <View style={styles.placeholder} />
        </View>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.statusCard, { backgroundColor: cardBg }]}>
            <View style={[styles.statusIcon, { backgroundColor: `${Palette.success}20` }]}> 
              <IconSymbol name="checkmark.circle.fill" size={48} color={Palette.success} />
            </View>
            <ThemedText style={[styles.statusTitle, { color: textColor }]}>Purchase Successful!</ThemedText>
            <ThemedText style={[styles.statusMessage, { color: secondaryTextColor }]}>Your gift card order was completed successfully.</ThemedText>
          </View>
          <View style={[styles.card, { backgroundColor: cardBg }]}> 
            <ThemedText style={[styles.cardTitle, { color: textColor }]}>Order Details</ThemedText>
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <ThemedText style={[styles.detailLabel, { color: secondaryTextColor }]}>Order ID:</ThemedText>
                <ThemedText style={[styles.detailValue, { color: textColor,width:'40%' }]}>{orderId || '-'}</ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText style={[styles.detailLabel, { color: secondaryTextColor }]}>Product:</ThemedText>
                <ThemedText style={[styles.detailValue, { color: textColor }]}>{productName || '-'}</ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText style={[styles.detailLabel, { color: secondaryTextColor }]}>Amount:</ThemedText>
                <ThemedText style={[styles.detailValue, { color: Palette.primary }]}>{currency} {amount}</ThemedText>
              </View>
            </View>
            <AppButton
              title="View Card & Redeem Code"
              onPress={() => {
                router.push({
                  pathname: '/giftcards/details',
                  params: {
                    orderId,
                    productName,
                    amount,
                    currency,
                    // Add these if available in params or fetch from API if needed
                    redeemCode: params?.redeemCode || '',
                    transactionId: params?.transactionId || '',
                  },
                });
              }}
              variant="outline"
              style={{ marginTop: 20 }}
            />
          </View>
        </ScrollView>
        <View style={[styles.footer, { backgroundColor: cardBg }]}> 
          <View style={styles.buttonContainer}>
            <AppButton
              title="New Purchase"
              onPress={handleNewPurchase}
              variant="dark"
              
              style={styles.newOrderButton}
            />
            <AppButton
              title="Go Home"
              onPress={handleGoHome}
            variant={isDark ? 'dark' : 'white'}
              style={styles.homeButton}
            />
          </View>
        </View>
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
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Belgrano-Regular',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statusCard: {
    borderRadius: 16,
    padding: 24,
    marginVertical: 12,
    alignItems: 'center',
  },
  statusIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Belgrano-Regular',
  },
  statusMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'Belgrano-Regular',
  },
  detailsContainer: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  newOrderButton: {
    flex: 1,
  },
  homeButton: {
    flex: 1,
  },
});
