import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { giftcardService, ReloadlyOrderCard, ReloadlyTransactionReport } from '@/services/apiService';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GiftCardDetailsScreen() {
  const navigation = useNavigation();
  React.useLayoutEffect(() => {
    navigation.setOptions({
title: `Gift Card Details${transaction?.product?.productName ? ' - ' + transaction.product.productName : ''}`,
      headerShown: true,
    });
  }, [navigation]);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams();
  // Expect params: { orderId, transactionId }
  const { orderId, transactionId } = params || {};

  const cardBg = isDark ? Palette.lighterBlack : Palette.white;
  const textColor = isDark ? Palette.white : Palette.black;
  const secondaryTextColor = isDark ? Palette.gray : '#6b7280';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<ReloadlyTransactionReport | null>(null);
  const [cards, setCards] = useState<ReloadlyOrderCard[] | null>(null);

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
      setError(null);
      try {
        if (!transactionId) throw new Error('No transaction ID provided');
        // Ensure transactionId is string or number, not array
        const txId = Array.isArray(transactionId) ? transactionId[0] : transactionId;
        const [txRes, cardsRes] = await Promise.all([
          giftcardService.getTransactionReport(txId),
          giftcardService.getOrderCards(txId),
        ]);
        if (!txRes.success) throw new Error('Failed to fetch transaction info');
        if (!cardsRes.success) throw new Error('Failed to fetch redeem code');
        setTransaction(txRes.data ?? null);
        setCards(cardsRes.data ?? null);
      } catch (e: any) {
        setError(e.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [transactionId]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
       
        <View style={[styles.card, { backgroundColor: cardBg }]}> 
          <ThemedText style={[styles.cardTitle, { color: textColor }]}>Order Details</ThemedText>
          {loading ? (
            <ThemedText style={{ color: secondaryTextColor, textAlign: 'center', marginVertical: 24 }}>Loading...</ThemedText>
          ) : error ? (
            <ThemedText style={{ color: Palette.error, textAlign: 'center', marginVertical: 24 }}>{error}</ThemedText>
          ) : transaction ? (
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <ThemedText style={[styles.detailLabel, { color: secondaryTextColor }]}>Order ID:</ThemedText>
                <ThemedText style={[styles.detailValue, { color: textColor }]}>{transaction.customIdentifier || '-'}</ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText style={[styles.detailLabel, { color: secondaryTextColor }]}>Product:</ThemedText>
                <ThemedText style={[styles.detailValue, { color: textColor }]}>{transaction.product?.productName || '-'}</ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText style={[styles.detailLabel, { color: secondaryTextColor }]}>Amount:</ThemedText>
                <ThemedText style={[styles.detailValue, { color: Palette.primary }]}>{transaction.currencyCode} {transaction.amount}</ThemedText>
              </View>
         
              <View style={styles.detailRow}>
                <ThemedText style={[styles.detailLabel, { color: secondaryTextColor }]}>Status:</ThemedText>
                <ThemedText style={[styles.detailValue, { color: transaction.status === 'SUCCESSFUL' ? Palette.success : Palette.error }]}>{transaction.status}</ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText style={[styles.detailLabel, { color: secondaryTextColor }]}>Date:</ThemedText>
                <ThemedText style={[styles.detailValue, { color: textColor }]}>{transaction.transactionCreatedTime}</ThemedText>
              </View>
              {cards && cards.length > 0 && cards.map((card, idx) => (
                <View key={idx} style={styles.redeemBlock}>
                  <View style={styles.detailRow}>
                    <ThemedText style={[styles.detailLabel, { color: secondaryTextColor }]}>Card Number:</ThemedText>
                    <View style={styles.copyRow}>
                      <ThemedText style={[styles.detailValue, { color: Palette.success }]}>{card.cardNumber}</ThemedText>
                      <TouchableOpacity
                        style={styles.copyIconBtn}
                        onPress={() => Clipboard.setStringAsync(card.cardNumber)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <MaterialIcons name="content-copy" size={20} color={Palette.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {card.pinCode && (
                    <View style={[styles.detailRow, { marginTop: 10 }]}> 
                      <ThemedText style={[styles.detailLabel, { color: secondaryTextColor }]}>PIN:</ThemedText>
                      <View style={styles.copyRow}>
                        <ThemedText style={[styles.detailValue, { color: Palette.success }]}>{card.pinCode}</ThemedText>
                        <TouchableOpacity
                          style={styles.copyIconBtn}
                          onPress={() => Clipboard.setStringAsync(card.pinCode)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <MaterialIcons name="content-copy" size={20} color={Palette.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : null}
        </View>
        <View style={styles.footer}>
          <AppButton
            title="Back to Home"
            onPress={() => router.replace('/(tabs)')}
            variant={isDark ? 'dark' : 'white'}
          />
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
    alignItems: 'center',
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Belgrano-Regular',
  },
  card: {
    borderRadius: 16,
    padding: 20,
    margin: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'Belgrano-Regular',
  },
  detailsContainer: {
    gap: 24,
  },
  redeemBlock: {
    marginBottom: 18,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'flex-end',
    flex: 1,
  },
  copyIconBtn: {
    marginLeft: 8,
    padding: 4,
    borderRadius: 6,
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
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
});
