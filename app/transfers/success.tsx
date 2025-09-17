import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNotification } from '@/components/InAppNotificationProvider';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ReceiptData, ReceiptService } from '@/services/receiptService';
import { useAppStore } from '@/store';

export default function TransferSuccessScreen() {
    const colorScheme = useColorScheme();
    const params = useLocalSearchParams();
    const { userData, addBeneficiary } = useAppStore();
    const notification = useNotification();
    const [beneficiarySaved, setBeneficiarySaved] = useState(false);
    
    // Extract transfer details from params
    const transferCode = params.transferCode as string;
    const reference = params.reference as string;
    const amount = params.amount as string;
    const recipientName = params.recipientName as string;
    const recipientAccount = params.recipientAccount as string;
    const recipientBank = params.recipientBank as string;
    const bankCode = params.bankCode as string; // We'll need to pass this from the transfer screen

    // Colors based on theme
    const backgroundColor = colorScheme === 'dark' ? Palette.black : Palette.white;
    const cardBackground = colorScheme === 'dark' ? Palette.lighterBlack : '#f8f9fa';
    const borderColor = colorScheme === 'dark' ? Palette.grayDark : '#e5e7eb';
    const textColor = colorScheme === 'dark' ? Palette.white : Palette.text;
    const secondaryTextColor = colorScheme === 'dark' ? Palette.gray : '#6b7280';
    const successColor = colorScheme === 'dark' ? '#10b981' : '#059669';

    const formatCurrency = (value: string | number): string => {
        const numericValue = typeof value === 'string' ? parseFloat(value) : value;
        return `₦${numericValue.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const formatDate = (): string => {
        const now = new Date();
        return now.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Add recipient as beneficiary automatically
    useEffect(() => {
        if (!beneficiarySaved && recipientName && recipientAccount && recipientBank) {
            const result = addBeneficiary({
                name: recipientName,
                accountNumber: recipientAccount,
                bankName: recipientBank,
                bankCode: bankCode || '', // Use bankCode if available
                serviceType: 'transfer'
            });

            if (result.success) {
                setBeneficiarySaved(true);
                notification.showNotification(result.message, 'success');
            } else {
                // Don't show error if beneficiary already exists
                setBeneficiarySaved(true);
            }
        }
    }, [addBeneficiary, recipientName, recipientAccount, recipientBank, bankCode, beneficiarySaved, notification]);

    const handleDone = () => {
        // Navigate back to transfers main screen
        router.push('/(tabs)');
    };

    const handleNewTransfer = () => {
        // Navigate to new transfer screen
        router.push('/transfers');
    };

    const handleShareReceipt = () => {
        const receiptData: ReceiptData = {
            transferCode,
            reference,
            amount,
            fee: '20.00',
            total: (parseFloat(amount) + 20).toString(),
            recipientName,
            recipientAccount,
            recipientBank,
            senderName: userData.fullname,
            senderAccount: userData.account_number,
            senderBank: userData.bank_name,
            date: formatDate(),
            status: 'successful',
            narration: 'Money Transfer'
        };

        ReceiptService.showReceiptOptions(receiptData);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.header, { borderBottomColor: borderColor }]}>
                    <TouchableOpacity
                        onPress={handleDone}
                        style={styles.backButtonHeader}
                    >
                        <IconSymbol name="xmark" size={24} color={textColor} />
                    </TouchableOpacity>
                    <ThemedText style={[styles.headerTitle, { color: textColor }]}>
                        Transfer Complete
                    </ThemedText>
                    <View style={styles.headerSpacer} />
                </View>

                <ThemedView style={[styles.content, { backgroundColor }]}>
                    {/* Success Icon and Message */}
                    <View style={styles.successContainer}>
                        <View style={[styles.successIcon, { backgroundColor: `${successColor}20` }]}>
                            <IconSymbol name="checkmark.circle.fill" size={64} color={successColor} />
                        </View>
                        <ThemedText style={[styles.successTitle, { color: textColor }]}>
                            Transfer Successful!
                        </ThemedText>
                        <ThemedText style={[styles.successMessage, { color: secondaryTextColor }]}>
                            Your transfer has been processed successfully
                        </ThemedText>
                    </View>

                    {/* Transfer Details */}
                    <View style={[styles.detailsCard, { backgroundColor: cardBackground, borderColor }]}>
                        <ThemedText style={[styles.detailsTitle, { color: textColor }]}>
                            Transfer Details
                        </ThemedText>
                        
                        <View style={styles.detailRow}>
                            <ThemedText style={[styles.detailLabel, { color: secondaryTextColor }]}>
                                Amount Sent
                            </ThemedText>
                            <ThemedText style={[styles.detailValue, { color: textColor }]}>
                                {formatCurrency(amount)}
                            </ThemedText>
                        </View>

                        <View style={styles.detailRow}>
                            <ThemedText style={[styles.detailLabel, { color: secondaryTextColor }]}>
                                Transfer Fee
                            </ThemedText>
                            <ThemedText style={[styles.detailValue, { color: textColor }]}>
                                ₦20.00
                            </ThemedText>
                        </View>

                        <View style={[styles.detailRow, styles.totalRow]}>
                            <ThemedText style={[styles.detailLabel, styles.totalLabel, { color: textColor }]}>
                                Total Debited
                            </ThemedText>
                            <ThemedText style={[styles.detailValue, styles.totalValue, { color: textColor }]}>
                                {formatCurrency(parseFloat(amount) + 20)}
                            </ThemedText>
                        </View>
                    </View>

                    {/* Recipient Information */}
                    <View style={[styles.recipientCard, { backgroundColor: cardBackground, borderColor }]}>
                        <View style={styles.recipientHeader}>
                            <IconSymbol name="person.circle" size={24} color={successColor} />
                            <ThemedText style={[styles.recipientTitle, { color: textColor }]}>
                                Sent To
                            </ThemedText>
                        </View>

                        <View style={styles.recipientDetails}>
                            <ThemedText style={[styles.recipientName, { color: textColor }]}>
                                {recipientName}
                            </ThemedText>
                            <ThemedText style={[styles.recipientInfo, { color: secondaryTextColor }]}>
                                {recipientAccount} • {recipientBank}
                            </ThemedText>
                        </View>
                    </View>

                    {/* Transaction Information */}
                    <View style={[styles.transactionCard, { backgroundColor: cardBackground, borderColor }]}>
                        <ThemedText style={[styles.transactionTitle, { color: textColor }]}>
                            Transaction Information
                        </ThemedText>
                        
                        <View style={styles.transactionRow}>
                            <ThemedText style={[styles.transactionLabel, { color: secondaryTextColor }]}>
                                Reference
                            </ThemedText>
                            <ThemedText style={[styles.transactionValue, { color: textColor }]}>
                                {reference}
                            </ThemedText>
                        </View>

                        <View style={styles.transactionRow}>
                            <ThemedText style={[styles.transactionLabel, { color: secondaryTextColor }]}>
                                Transfer Code
                            </ThemedText>
                            <ThemedText style={[styles.transactionValue, { color: textColor }]}>
                                {transferCode}
                            </ThemedText>
                        </View>

                        <View style={styles.transactionRow}>
                            <ThemedText style={[styles.transactionLabel, { color: secondaryTextColor }]}>
                                Date & Time
                            </ThemedText>
                            <ThemedText style={[styles.transactionValue, { color: textColor }]}>
                                {formatDate()}
                            </ThemedText>
                        </View>

                        <View style={styles.transactionRow}>
                            <ThemedText style={[styles.transactionLabel, { color: secondaryTextColor }]}>
                                Status
                            </ThemedText>
                            <View style={styles.statusContainer}>
                                <IconSymbol name="checkmark.circle.fill" size={16} color={successColor} />
                                <ThemedText style={[styles.statusText, { color: successColor }]}>
                                    Completed
                                </ThemedText>
                            </View>
                        </View>
                    </View>

                    {/* Receipt Actions */}
                    <TouchableOpacity
                        style={[styles.shareButton, { backgroundColor: cardBackground, borderColor }]}
                        onPress={handleShareReceipt}
                    >
                        <IconSymbol name="receipt" size={20} color={textColor} />
                        <ThemedText style={[styles.shareText, { color: textColor }]}>
                            Get Receipt
                        </ThemedText>
                    </TouchableOpacity>
                </ThemedView>
            </ScrollView>

            {/* Action Buttons */}
            <View style={[styles.footer, { backgroundColor, borderTopColor: borderColor }]}>
                <View style={styles.buttonContainer}>
                    <AppButton
                        title="New Transfer"
                        onPress={handleNewTransfer}
                        variant="outline"
                        style={styles.newTransferButton}
                        textStyle={{ color: colorScheme === "dark" ? Palette.white : Palette.black }}
                    />
                    <AppButton
                        title="Done"
                        onPress={handleDone}
                        variant={colorScheme === "dark" ? "white" : "dark"}
                        style={styles.doneButton}
                    />
                </View>
            </View>
            
           
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
