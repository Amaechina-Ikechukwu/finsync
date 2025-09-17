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
import TransactionPinModal from '@/components/TransactionPinModal';
import AppButton from '@/components/ui/AppButton';
import CustomAlert from '@/components/ui/CustomAlert';
import FSActivityLoader from '@/components/ui/FSActivityLoader';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { RecipientData, transferService } from '@/services/apiService';
import { useAppStore } from '@/store';

export default function TransferConfirmationScreen() {
    const colorScheme = useColorScheme();
    const { showNotification } = useNotification();
    const { userData, updateBalance } = useAppStore();
    const params = useLocalSearchParams();
    
    const [isCreatingRecipient, setIsCreatingRecipient] = useState(false);
    const [recipientData, setRecipientData] = useState<RecipientData | null>(null);
    const [isTransferring, setIsTransferring] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [showPinRequiredAlert, setShowPinRequiredAlert] = useState(false);
    const [showConfirmAlert, setShowConfirmAlert] = useState(false);

    // Extract params
    const bankName = params.bankName as string;
    const bankCode = params.bankCode as string;
    const accountNumber = params.accountNumber as string;
    const accountName = params.accountName as string;
    const bankId = params.bankId as string;
    const amount = params.amount as string;

    // Colors based on theme
    const backgroundColor = colorScheme === 'dark' ? Palette.black : Palette.white;
    const cardBackground = colorScheme === 'dark' ? Palette.lighterBlack : '#f8f9fa';
    const borderColor = colorScheme === 'dark' ? Palette.grayDark : '#e5e7eb';
    const textColor = colorScheme === 'dark' ? Palette.white : Palette.text;
    const secondaryTextColor = colorScheme === 'dark' ? Palette.gray : '#6b7280';
    const successColor = colorScheme === 'dark' ? '#10b981' : '#059669';

    useEffect(() => {
        if (accountNumber && bankCode && accountName) {
            createRecipient();
        }
    }, []);

    const createRecipient = async () => {
        setIsCreatingRecipient(true);
        showNotification('Setting up recipient...', 'info');

        try {
            const response = await transferService.createRecipient({
                account_number: accountNumber,
                bank_code: bankCode,
                name: accountName
            });

            if (response.success && response.data) {
                setRecipientData(response.data);
                showNotification('Recipient created successfully', 'success');
            } else {
                showNotification(response.message || 'Failed to create recipient', 'error');
                router.back();
            }
        } catch (error) {
            console.error('Error creating recipient:', error);
            showNotification('Failed to create recipient. Please try again.', 'error');
            router.back();
        } finally {
            setIsCreatingRecipient(false);
        }
    };

    const formatCurrency = (value: string | number): string => {
        const numericValue = typeof value === 'string' ? parseFloat(value) : value;
        return `₦${numericValue.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const handleConfirmTransfer = () => {
        if (!recipientData) {
            showNotification('Recipient not ready. Please wait.', 'error');
            return;
        }

        // Check if user has transaction PIN set
        if (!userData.hasTransactionPin) {
            setShowPinRequiredAlert(true);
            return;
        }

        setShowConfirmAlert(true);
    };

    const processTransfer = async (pin: string) => {
        if (!recipientData) return;

        setIsTransferring(true);
        setShowPinModal(false);
        showNotification('Processing transfer...', 'info');

        try {
            const response = await transferService.processTransfer({
                amount: amount,
                pin: pin,
                recipient_code: recipientData.recipient_code
            });

            if (response.success && response.data) {
                showNotification('Transfer completed successfully!', 'success');
                
                // Update user balance by deducting transfer amount + fee
                const newBalance = userData.amount - parseFloat(amount) - 20;
                updateBalance(newBalance);
                
                // Navigate to success screen with transfer details
                router.push({
                    pathname: '/transfers/success',
                    params: {
                        transferCode: response.data.transfer_code,
                        reference: response.data.reference,
                        amount: amount,
                        recipientName: recipientData.name,
                        recipientAccount: recipientData.account_number,
                        recipientBank: recipientData.bank_name,
                        bankCode: bankCode, // Add bankCode for beneficiary saving
                        fee: '20.00',
                        total: (parseFloat(amount) + 20).toString()
                    }
                });
            } else {
                showNotification(response.message || 'Transfer failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Transfer error:', error);
            showNotification('Transfer failed. Please try again.', 'error');
        } finally {
            setIsTransferring(false);
        }
    };

    const handleEditTransfer = () => {
        router.back();
    };

    if (isCreatingRecipient) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor }]}>
                <View style={styles.loadingContainer}>
                    <FSActivityLoader />
                    <ThemedText style={[styles.loadingText, { color: textColor }]}>
                        Setting up recipient...
                    </ThemedText>
                </View>
            </SafeAreaView>
        );
    }

    if (!recipientData) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor }]}>
                <View style={styles.loadingContainer}>
                    <ThemedText style={[styles.loadingText, { color: textColor }]}>
                        Something went wrong. Please try again.
                    </ThemedText>
                    <AppButton
                        title="Go Back"
                        onPress={() => router.back()}
                        variant="outline"
                        style={styles.backButton}
                    />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.header, { borderBottomColor: borderColor }]}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButtonHeader}
                    >
                        <IconSymbol name="chevron.left" size={24} color={textColor} />
                    </TouchableOpacity>
                    <ThemedText style={[styles.headerTitle, { color: textColor }]}>
                        Confirm Transfer
                    </ThemedText>
                    <View style={styles.headerSpacer} />
                </View>

                <ThemedView style={[styles.content, { backgroundColor }]}>
                    {/* Transfer Summary */}
                    <View style={[styles.summaryCard, { backgroundColor: cardBackground, borderColor }]}>
                        <ThemedText style={[styles.summaryTitle, { color: textColor }]}>
                            Transfer Summary
                        </ThemedText>
                        
                        <View style={styles.summaryRow}>
                            <ThemedText style={[styles.summaryLabel, { color: secondaryTextColor }]}>
                                Amount
                            </ThemedText>
                            <ThemedText style={[styles.summaryValue, { color: textColor }]}>
                                {formatCurrency(amount)}
                            </ThemedText>
                        </View>

                        <View style={styles.summaryRow}>
                            <ThemedText style={[styles.summaryLabel, { color: secondaryTextColor }]}>
                                Transfer Fee
                            </ThemedText>
                            <ThemedText style={[styles.summaryValue, { color: textColor }]}>
                                ₦20.00
                            </ThemedText>
                        </View>

                        <View style={[styles.summaryRow, styles.totalRow]}>
                            <ThemedText style={[styles.summaryLabel, styles.totalLabel, { color: textColor }]}>
                                Total
                            </ThemedText>
                            <ThemedText style={[styles.summaryValue, styles.totalValue, { color: textColor }]}>
                                {formatCurrency(parseFloat(amount) + 20)}
                            </ThemedText>
                        </View>
                    </View>

                    {/* Recipient Details */}
                    <View style={[styles.recipientCard, { backgroundColor: cardBackground, borderColor }]}>
                        <View style={styles.recipientHeader}>
                            <IconSymbol name="person.circle" size={24} color={successColor} />
                            <ThemedText style={[styles.recipientTitle, { color: textColor }]}>
                                Recipient Details
                            </ThemedText>
                        </View>

                        <View style={styles.recipientDetails}>
                            <ThemedText style={[styles.recipientName, { color: textColor }]}>
                                {recipientData.name}
                            </ThemedText>
                            <ThemedText style={[styles.recipientInfo, { color: secondaryTextColor }]}>
                                {recipientData.account_number} • {recipientData.bank_name}
                            </ThemedText>
                           
                        </View>
                    </View>

                    {/* Account Balance */}
                    <View style={[styles.balanceCard, { backgroundColor: cardBackground, borderColor }]}>
                        <ThemedText style={[styles.balanceLabel, { color: secondaryTextColor }]}>
                            Current Balance
                        </ThemedText>
                        <ThemedText style={[styles.balanceAmount, { color: textColor }]}>
                            {formatCurrency(userData.amount)}
                        </ThemedText>
                        <ThemedText style={[styles.balanceAfter, { color: secondaryTextColor }]}>
                            Balance after transfer: {formatCurrency(userData.amount - parseFloat(amount) - 20)}
                        </ThemedText>
                    </View>
                </ThemedView>
            </ScrollView>

            {/* Action Buttons */}
            <View style={[styles.footer, { backgroundColor, borderTopColor: borderColor }]}>
                <View style={styles.buttonContainer}>
                    <AppButton
                        title="Edit Transfer"
                        onPress={handleEditTransfer}
                        variant="outline"
                        style={styles.editButton}
                        disabled={isTransferring}
                        textStyle={{color:colorScheme=="dark"?Palette.white:Palette.black }}
                    />
                    <AppButton
                        title={isTransferring ? "Processing..." : "Confirm Transfer"}
                        onPress={handleConfirmTransfer}
                        variant={colorScheme=="dark"?"white":"dark"}
                        style={styles.confirmButton}
                        disabled={isTransferring}
                        loading={isTransferring}
                    />
                </View>
            </View>
            
            {/* Transaction PIN Modal */}
            <TransactionPinModal
                visible={showPinModal}
                onClose={() => setShowPinModal(false)}
                onPinEntered={processTransfer}
                isProcessing={isTransferring}
                title="Enter Transaction PIN"
                subtitle="Please enter your 4-digit transaction PIN to complete the transfer"
            />
            
            {/* PIN Required Alert */}
            <CustomAlert
                visible={showPinRequiredAlert}
                title="Transaction PIN Required"
                message="You need to set up a transaction PIN to make transfers. Please set it up from your account settings."
                icon="security"
                iconColor={Palette.warning}
                buttons={[
                    {
                        text: 'OK',
                        style: 'default',
                        onPress: () => setShowPinRequiredAlert(false)
                    }
                ]}
                onRequestClose={() => setShowPinRequiredAlert(false)}
            />
            
            {/* Confirm Transfer Alert */}
            <CustomAlert
                visible={showConfirmAlert}
                title="Confirm Transfer"
                message={recipientData ? `Are you sure you want to transfer ${formatCurrency(amount)} to ${recipientData.name}?` : ''}
                icon="receipt"
                iconColor={Palette.primary}
                buttons={[
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => setShowConfirmAlert(false)
                    },
                    {
                        text: 'Confirm',
                        style: 'default',
                        onPress: () => {
                            setShowConfirmAlert(false);
                            setShowPinModal(true);
                        }
                    }
                ]}
                onRequestClose={() => setShowConfirmAlert(false)}
            />
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    loadingText: {
        fontSize: 16,
        marginTop: 16,
        textAlign: 'center',
    },
    backButton: {
        marginTop: 20,
        width: 150,
    },
    summaryCard: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 20,
        marginBottom: 20,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: '600',
        fontFamily: 'Belgrano-Regular',
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 16,
    },
    summaryValue: {
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
    recipientCode: {
        fontSize: 12,
        fontStyle: 'italic',
    },
    balanceCard: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 20,
        alignItems: 'center',
        marginBottom: 20,
    },
    balanceLabel: {
        fontSize: 14,
        marginBottom: 8,
    },
    balanceAmount: {
        fontSize: 24,
        fontWeight: '700',
        fontFamily: 'Belgrano-Regular',
        marginBottom: 8,
    },
    balanceAfter: {
        fontSize: 14,
        textAlign: 'center',
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
    editButton: {
        flex: 1,
    },
    confirmButton: {
        flex: 2,
    },
});
