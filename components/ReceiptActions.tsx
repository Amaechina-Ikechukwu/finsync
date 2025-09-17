import AppButton from '@/components/ui/AppButton';
import { ReceiptData, ReceiptService } from '@/services/receiptService';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface ReceiptActionsProps {
  transferData: {
    transferCode: string;
    reference: string;
    amount: string;
    recipientName: string;
    recipientAccount: string;
    recipientBank: string;
    senderName: string;
    senderAccount: string;
    senderBank: string;
    fee?: string;
    narration?: string;
  };
}

export default function ReceiptActions({ transferData }: ReceiptActionsProps) {
  const generateReceipt = () => {
    const receiptData: ReceiptData = {
      transferCode: transferData.transferCode,
      reference: transferData.reference,
      amount: transferData.amount,
      fee: transferData.fee || '20.00',
      total: transferData.fee 
        ? (parseFloat(transferData.amount) + parseFloat(transferData.fee)).toString()
        : (parseFloat(transferData.amount) + 20).toString(),
      recipientName: transferData.recipientName,
      recipientAccount: transferData.recipientAccount,
      recipientBank: transferData.recipientBank,
      senderName: transferData.senderName,
      senderAccount: transferData.senderAccount,
      senderBank: transferData.senderBank,
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      status: 'successful',
      narration: transferData.narration || 'Money Transfer'
    };

    // Show receipt options (Share, Print, Save)
    ReceiptService.showReceiptOptions(receiptData);
  };

  const quickShare = async () => {
    const receiptData: ReceiptData = {
      transferCode: transferData.transferCode,
      reference: transferData.reference,
      amount: transferData.amount,
      fee: transferData.fee || '20.00',
      total: transferData.fee 
        ? (parseFloat(transferData.amount) + parseFloat(transferData.fee)).toString()
        : (parseFloat(transferData.amount) + 20).toString(),
      recipientName: transferData.recipientName,
      recipientAccount: transferData.recipientAccount,
      recipientBank: transferData.recipientBank,
      senderName: transferData.senderName,
      senderAccount: transferData.senderAccount,
      senderBank: transferData.senderBank,
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      status: 'successful',
      narration: transferData.narration || 'Money Transfer'
    };

    // Directly share the receipt
    await ReceiptService.shareReceipt(receiptData);
  };

  return (
    <View style={styles.container}>
      <AppButton
        title="Get Receipt"
        onPress={generateReceipt}
        variant="outline"
        style={styles.button}
      />
      <AppButton
        title="Share Receipt"
        onPress={quickShare}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
  },
});
