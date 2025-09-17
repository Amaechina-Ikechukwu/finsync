import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ReceiptService } from '@/services/receiptService';
import { useAppStore } from '@/store';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BuySuccessScreen() {
  const params = useLocalSearchParams();
  const r = useRouter();
  const colorScheme = useColorScheme();
  const { userData } = useAppStore();

  const coin = String(params.coin ?? '').toUpperCase();
  const txId = String(params.txId ?? '');
  const amountNaira = String(params.amount_naira ?? '0');
  const cryptoAmount = String(params.crypto_amount ?? '');
  const estimated = String(params.estimated_delivery ?? '');
  const message = String(params.message ?? '');
  const wallet = String(params.user_wallet_address ?? '');

  const backgroundColor = colorScheme === 'dark' ? Palette.black : Palette.white;
  const cardBackground = colorScheme === 'dark' ? Palette.lighterBlack : '#f8f9fa';
  const borderColor = colorScheme === 'dark' ? Palette.grayDark : '#e5e7eb';
  const textColor = colorScheme === 'dark' ? Palette.white : Palette.text;
  const secondaryTextColor = colorScheme === 'dark' ? Palette.gray : '#6b7280';
  const successColor = colorScheme === 'dark' ? '#10b981' : '#059669';

  const formatCurrency = (value: string | number) => {
    const numeric = typeof value === 'string' ? parseFloat(value || '0') : value;
    return `₦${Number(numeric).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    // No-op for now, kept for parity with transfers design where effects live
  }, []);

  const handleGoTransactions = () => r.push('/transactions');
  const handleHome = () => r.replace('/');

  const handleShareReceipt = () => {
    const receiptData = {
      reference: txId,
      amount: amountNaira,
      fee: '0.00',
      total: amountNaira,
      coin,
      cryptoAmount,
      destination: wallet,
      senderName: userData?.fullname || '',
      date: formatDate(),
      status: 'processing',
      narration: message || `Buy ${coin}`,
    } as any;

    ReceiptService.showReceiptOptions(receiptData);
  };

  return (
        <SafeAreaView style={styles.container} edges={{bottom:'off',top:"maximum"}}>
             <ThemedView style={[styles.container, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <TouchableOpacity onPress={handleHome} style={styles.backButtonHeader}>
            <IconSymbol name="xmark" size={24} color={textColor} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: textColor }]}>Order Complete</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <ThemedView style={[styles.content, { backgroundColor }]}>
          <View style={styles.successContainer}>
            <View style={[styles.successIcon, { backgroundColor: `${successColor}20` }]}>
              <IconSymbol name="checkmark.circle.fill" size={64} color={successColor} />
            </View>
            <ThemedText style={[styles.successTitle, { color: textColor }]}>Purchase Successful!</ThemedText>
            <ThemedText style={[styles.successMessage, { color: secondaryTextColor }]}>Your order is being processed.</ThemedText>
          </View>

          <View style={[styles.detailsCard, { backgroundColor: cardBackground, borderColor }]}>
            <ThemedText style={[styles.detailsTitle, { color: textColor }]}>Order Details</ThemedText>

            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: secondaryTextColor }]}>Coin</ThemedText>
              <ThemedText style={[styles.detailValue, { color: textColor }]}>{coin} • {cryptoAmount}</ThemedText>
            </View>

            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: secondaryTextColor }]}>Amount (₦)</ThemedText>
              <ThemedText style={[styles.detailValue, { color: textColor }]}>{formatCurrency(amountNaira)}</ThemedText>
            </View>

            <View style={[styles.detailRow, styles.totalRow]}>
              <ThemedText style={[styles.totalLabel, { color: textColor }]}>Estimated Delivery</ThemedText>
              <ThemedText style={[styles.totalValue, { color: textColor,width:"60%" }]}>{message || estimated}</ThemedText>
            </View>
          </View>

          <View style={[styles.recipientCard, { backgroundColor: cardBackground, borderColor,flexDirection:'row' }]}>
            <View style={styles.recipientHeader}>
              <MaterialIcons name="wallet" size={24} color={successColor} />
              <ThemedText style={[styles.recipientTitle, { color: textColor }]}>Destination Wallet</ThemedText>
            </View>

            <View style={styles.recipientDetails}>
              <ThemedText style={[styles.recipientName, { color: textColor }]} numberOfLines={1}>{wallet}</ThemedText>
              <ThemedText style={[styles.recipientInfo, { color: secondaryTextColor }]}>{coin}</ThemedText>
            </View>
          </View>

          <View style={[styles.transactionCard, { backgroundColor: cardBackground, borderColor }]}>
            <ThemedText style={[styles.transactionTitle, { color: textColor }]}>Transaction Information</ThemedText>

            <View style={styles.transactionRow}>
              <ThemedText style={[styles.transactionLabel, { color: secondaryTextColor }]}>Transaction ID</ThemedText>
              <ThemedText style={[styles.transactionValue, { color: textColor }]}>{txId}</ThemedText>
            </View>

            <View style={styles.transactionRow}>
              <ThemedText style={[styles.transactionLabel, { color: secondaryTextColor }]}>Date & Time</ThemedText>
              <ThemedText style={[styles.transactionValue, { color: textColor }]}>{formatDate()}</ThemedText>
            </View>

            <View style={styles.transactionRow}>
              <ThemedText style={[styles.transactionLabel, { color: secondaryTextColor }]}>Status</ThemedText>
              <View style={styles.statusContainer}>
                <IconSymbol name="checkmark.circle.fill" size={16} color={successColor} />
                <ThemedText style={[styles.statusText, { color: successColor }]}>Processing</ThemedText>
              </View>
            </View>
          </View>

          {/* <TouchableOpacity style={[styles.shareButton, { backgroundColor: cardBackground, borderColor }]} onPress={handleShareReceipt}>
            <IconSymbol name="receipt" size={20} color={textColor} />
            <ThemedText style={[styles.shareText, { color: textColor }]}>Get Receipt</ThemedText>
          </TouchableOpacity> */}
        </ThemedView>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor, borderTopColor: borderColor }]}>
        <View style={styles.buttonContainer}>
          {/* <AppButton title="Go to transactions" onPress={handleGoTransactions} variant="outline" style={styles.newTransferButton} textStyle={{ color: colorScheme === 'dark' ? Palette.white : Palette.black }} /> */}
          <AppButton title="Back to home" onPress={handleHome} variant={colorScheme === 'dark' ? 'white' : 'dark'} style={styles.doneButton} />
        </View>
      </View>
    </ThemedView>
        </SafeAreaView>
   
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButtonHeader: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Belgrano-Regular',
    flex: 1,
    textAlign: 'center',
    marginRight: 32,
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Belgrano-Regular',
    textAlign: 'center',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  detailsCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Belgrano-Regular',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
    marginTop: 8,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  recipientCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  recipientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recipientTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Belgrano-Regular',
    marginLeft: 8,
  },
  recipientDetails: {
    paddingLeft: 32,
  },
  recipientName: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Belgrano-Regular',
    marginBottom: 4,
  },
  recipientInfo: {
    fontSize: 14,
    marginBottom: 4,
  },
  transactionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  transactionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Belgrano-Regular',
    marginBottom: 16,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionLabel: {
    fontSize: 14,
    flex: 1,
  },
  transactionValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 20,
  },
  shareText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  newTransferButton: {
    flex: 1,
  },
  doneButton: {
    flex: 1,
  },
});
