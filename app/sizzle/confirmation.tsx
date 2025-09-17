import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
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
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { sizzleService } from '@/services/apiService';
import { useAppStore } from '@/store';

interface OrderData {
    service: {
        service: string;
        name: string;
        category: string;
        rate: number;
        min: string;
        max: string;
        currency: string;
    };
    socialAccountLink: string;
    email: string;
    quantity: number;
    totalAmount: number;
}

export default function SizzleConfirmationScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { showNotification } = useNotification();
    const { userData, updateBalance } = useAppStore();
    const params = useLocalSearchParams();
    
    const [showPinModal, setShowPinModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const orderData: OrderData = JSON.parse(params.orderData as string);

    const cardBg = isDark ? Palette.lighterBlack : Palette.white;
    const borderColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
    const textColor = isDark ? Palette.white : Palette.black;
    const secondaryTextColor = isDark ? Palette.gray : '#6b7280';

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
        }).format(amount );
    };

    const handleConfirmOrder = () => {
        if (!userData.hasTransactionPin) {
            showNotification('Transaction PIN is required', 'error');
            return;
        }
        setShowPinModal(true);
    };

    const processOrder = async (pin: string) => {
        try {
            setIsProcessing(true);

            const orderPayload = {
                serviceId: orderData.service.service,
                link: orderData.socialAccountLink,
                email: orderData.email,
                quantity: orderData.quantity,
                transaction_pin: pin
            };

            const response = await sizzleService.placeOrder(orderPayload);

            if (response.success && response.data) {
                // Update balance if available
                if (response.data.amount && userData.amount) {
                    updateBalance(userData.amount - response.data.amount);
                }

                // Navigate to success screen
                router.replace({
                    pathname: '/sizzle/success',
                    params: {
                        orderData: JSON.stringify({
                            ...orderData,
                            orderId: response.data.order_id,
                            status: response.data.status
                        })
                    }
                });
            } else {
                showNotification(response.message || 'Order failed. Please try again.', 'error');
            }
        } catch (error: any) {
            console.error('Order error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Network error. Please try again.';
            showNotification(errorMessage, 'error');
        } finally {
            setIsProcessing(false);
            setShowPinModal(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: borderColor }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <IconSymbol name="chevron.left" size={24} color={textColor} />
                    </TouchableOpacity>
                    <ThemedText style={[styles.headerTitle, { color: textColor }]}>
                        Confirm Order
                    </ThemedText>
                    <View style={styles.placeholder} />
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Order Summary */}
                    <View style={[styles.card, { backgroundColor: cardBg }]}>
                        <View style={styles.cardHeader}>
                            <IconSymbol name="doc.text" size={24} color={Palette.primary} />
                            <ThemedText style={[styles.cardTitle, { color: textColor }]}>
                                Order Summary
                            </ThemedText>
                        </View>

                        <View style={styles.detailsContainer}>
                            <View style={styles.detailRow}>
                                <ThemedText style={[styles.detailLabel, { color: secondaryTextColor }]}>
                                    Service:
                                </ThemedText>
                                <ThemedText style={[styles.detailValue, { color: textColor }]} numberOfLines={2}>
                                    {orderData.service.name}
                                </ThemedText>
                            </View>

                            <View style={styles.detailRow}>
                                <ThemedText style={[styles.detailLabel, { color: secondaryTextColor }]}>
                                    Category:
                                </ThemedText>
                                <ThemedText style={[styles.detailValue, { color: textColor }]} numberOfLines={2}>
                                    {orderData.service.category}
                                </ThemedText>
                            </View>

                            <View style={styles.detailRow}>
                                <ThemedText style={[styles.detailLabel, { color: secondaryTextColor }]}>
                                    Link/Email:
                                </ThemedText>
                                <ThemedText style={[styles.detailValue, { color: textColor }]} numberOfLines={2}>
                                    {orderData.socialAccountLink}
                                </ThemedText>
                            </View>

                            <View style={styles.detailRow}>
                                <ThemedText style={[styles.detailLabel, { color: secondaryTextColor }]}>
                                    Your Email:
                                </ThemedText>
                                <ThemedText style={[styles.detailValue, { color: textColor }]}>
                                    {orderData.email}
                                </ThemedText>
                            </View>

                            <View style={styles.detailRow}>
                                <ThemedText style={[styles.detailLabel, { color: secondaryTextColor }]}>
                                    Quantity:
                                </ThemedText>
                                <ThemedText style={[styles.detailValue, { color: textColor }]}>
                                    {orderData.quantity}
                                </ThemedText>
                            </View>

                            <View style={styles.detailRow}>
                                <ThemedText style={[styles.detailLabel, { color: secondaryTextColor }]}>
                                    Rate per unit:
                                </ThemedText>
                                <ThemedText style={[styles.detailValue, { color: textColor }]}>
                                    {formatCurrency(orderData.service.rate)}
                                </ThemedText>
                            </View>
                        </View>
                    </View>

                    {/* Payment Information */}
                    <View style={[styles.card, { backgroundColor: cardBg }]}>
                        <View style={styles.cardHeader}>
                            <IconSymbol name="creditcard" size={24} color={Palette.primary} />
                            <ThemedText style={[styles.cardTitle, { color: textColor }]}>
                                Payment Information
                            </ThemedText>
                        </View>

                        <View style={styles.detailsContainer}>
                            <View style={styles.detailRow}>
                                <ThemedText style={[styles.detailLabel, { color: secondaryTextColor }]}>
                                    Subtotal:
                                </ThemedText>
                                <ThemedText style={[styles.detailValue, { color: textColor }]}>
                                    {formatCurrency(orderData.totalAmount)}
                                </ThemedText>
                            </View>

                            <View style={[styles.totalRow, { borderTopColor: borderColor }]}>
                                <ThemedText style={[styles.totalLabel, { color: textColor }]}>
                                    Total Amount:
                                </ThemedText>
                                <ThemedText style={[styles.totalValue, { color: Palette.primary }]}>
                                    {formatCurrency(orderData.totalAmount)}
                                </ThemedText>
                            </View>
                        </View>
                    </View>

                    {/* Account Balance */}
                    <View style={[styles.card, { backgroundColor: cardBg }]}>
                        <View style={styles.cardHeader}>
                            <IconSymbol name="wallet.pass" size={24} color={Palette.primary} />
                            <ThemedText style={[styles.cardTitle, { color: textColor }]}>
                                Account Balance
                            </ThemedText>
                        </View>

                        <View style={styles.detailsContainer}>
                            <View style={styles.detailRow}>
                                <ThemedText style={[styles.detailLabel, { color: secondaryTextColor }]}>
                                    Current Balance:
                                </ThemedText>
                                <ThemedText style={[styles.detailValue, { color: textColor }]}>
                                    {formatCurrency((userData.amount || 0) * 100)}
                                </ThemedText>
                            </View>

                            <View style={styles.detailRow}>
                                <ThemedText style={[styles.detailLabel, { color: secondaryTextColor }]}>
                                    Amount to be charged:
                                </ThemedText>
                                <ThemedText style={[styles.detailValue, { color: Palette.coral }]}>
                                    -{formatCurrency(orderData.totalAmount)}
                                </ThemedText>
                            </View>

                            <View style={[styles.totalRow, { borderTopColor: borderColor }]}>
                                <ThemedText style={[styles.totalLabel, { color: textColor }]}>
                                    Balance after payment:
                                </ThemedText>
                                <ThemedText style={[styles.totalValue, { color: textColor }]}>
                                    {formatCurrency(((userData.amount || 0) * 100) - orderData.totalAmount)}
                                </ThemedText>
                            </View>
                        </View>

                        {/* Insufficient balance warning */}
                        {userData.amount && ((userData.amount * 100) < orderData.totalAmount) && (
                            <View style={[styles.warningContainer, { backgroundColor: `${Palette.coral}20`, borderColor: Palette.coral }]}>
                                <IconSymbol name="exclamationmark.triangle.fill" size={20} color={Palette.coral} />
                                <ThemedText style={[styles.warningText, { color: Palette.coral }]}>
                                    Insufficient balance. Please fund your account.
                                </ThemedText>
                            </View>
                        )}
                    </View>

                    {/* Important Note */}
                    <View style={[styles.noteCard, { backgroundColor: `${Palette.info}20`, borderColor: Palette.info }]}>
                        <IconSymbol name="info.circle.fill" size={20} color={Palette.info} />
                        <View style={styles.noteContent}>
                            <ThemedText style={[styles.noteTitle, { color: Palette.info }]}>
                                Important Note
                            </ThemedText>
                            <ThemedText style={[styles.noteText, { color: textColor }]}>
                                Please ensure all details are correct before confirming. Account details will be sent to your email instantly.
                            </ThemedText>
                        </View>
                    </View>
                </ScrollView>

                {/* Footer */}
                <View style={[styles.footer, { backgroundColor: cardBg, borderTopColor: borderColor }]}>
                    <View style={styles.buttonContainer}>
                        <AppButton
                            title="Edit Order"
                            onPress={() => router.back()}
                            variant={isDark ? 'dark' : 'white'}
                            style={styles.editButton}
                        />
                        <AppButton
                            title="Confirm Order"
                            onPress={handleConfirmOrder}
                            variant="dark"
                            style={styles.confirmButton}
                            disabled={userData.amount && ((userData.amount * 100) < orderData.totalAmount)}
                        />
                    </View>
                </View>

                {/* Transaction PIN Modal */}
                <TransactionPinModal
                    visible={showPinModal}
                    onClose={() => setShowPinModal(false)}
                    onPinEntered={processOrder}
                    isProcessing={isProcessing}
                    title="Confirm Purchase"
                    subtitle="Enter your transaction PIN to complete this order"
                />
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
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 8,
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
    card: {
        borderRadius: 16,
        padding: 20,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 12,
        fontFamily: 'Belgrano-Regular',
    },
    detailsContainer: {
        gap: 12,
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
        flex: 1.5,
        textAlign: 'right',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        marginTop: 12,
        borderTopWidth: 1,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '600',
    },
    totalValue: {
        fontSize: 20,
        fontWeight: '700',
    },
    warningContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        marginTop: 16,
    },
    warningText: {
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 8,
        flex: 1,
    },
    noteCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginVertical: 8,
    },
    noteContent: {
        flex: 1,
        marginLeft: 12,
    },
    noteTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    noteText: {
        fontSize: 14,
        lineHeight: 20,
    },
    footer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
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
