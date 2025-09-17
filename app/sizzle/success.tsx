import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
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
    orderId: string;
    status: string;
}

export default function SizzleSuccessScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { showNotification } = useNotification();
    const params = useLocalSearchParams();

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
        }).format(amount);
    };

    const copyToClipboard = async (text: string, label: string) => {
        try {
            await Clipboard.setStringAsync(text);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            showNotification(`${label} copied to clipboard`, 'success');
        } catch (error) {
            showNotification('Failed to copy to clipboard', 'error');
        }
    };

    const handleNewOrder = () => {
        router.replace('/sizzle');
    };

    const handleGoHome = () => {
        router.replace('/(tabs)');
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
            case 'success':
                return Palette.success;
            case 'pending':
            case 'processing':
                return Palette.warning;
            case 'failed':
            case 'error':
                return Palette.coral;
            default:
                return Palette.primary;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
            case 'success':
                return 'checkmark.circle.fill';
            case 'pending':
            case 'processing':
                return 'clock.fill';
            case 'failed':
            case 'error':
                return 'xmark.circle.fill';
            default:
                return 'info.circle.fill';
        }
    };

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: borderColor }]}>
                    <View style={styles.placeholder} />
                    <ThemedText style={[styles.headerTitle, { color: textColor }]}>
                        Order Complete
                    </ThemedText>
                    <TouchableOpacity onPress={handleGoHome} style={styles.closeButton}>
                        <IconSymbol name="xmark" size={24} color={textColor} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Success Status */}
                    <View style={[styles.statusCard, { backgroundColor: cardBg }]}>
                        <View style={[styles.statusIcon, { backgroundColor: `${getStatusColor(orderData.status)}20` }]}>
                            <IconSymbol 
                                name={getStatusIcon(orderData.status)} 
                                size={48} 
                                color={getStatusColor(orderData.status)} 
                            />
                        </View>
                        
                        <ThemedText style={[styles.statusTitle, { color: textColor }]}>
                            Order {orderData.status === 'success' ? 'Successful' : orderData.status}!
                        </ThemedText>
                        
                        <ThemedText style={[styles.statusMessage, { color: secondaryTextColor }]}>
                            Your social media growth order has been {orderData.status.toLowerCase()}. 
                            Account details will be sent to your email shortly.
                        </ThemedText>
                    </View>

                    {/* Order Details */}
                    <View style={[styles.card, { backgroundColor: cardBg }]}>
                        <View style={styles.cardHeader}>
                            <IconSymbol name="doc.text" size={24} color={Palette.primary} />
                            <ThemedText style={[styles.cardTitle, { color: textColor }]}>
                                Order Details
                            </ThemedText>
                        </View>

                        <View style={styles.detailsContainer}>
                            <View style={styles.detailRow}>
                                <ThemedText style={[styles.detailLabel, { color: secondaryTextColor }]}>
                                    Order ID:
                                </ThemedText>
                                <TouchableOpacity 
                                    style={styles.copyableValue}
                                    onPress={() => copyToClipboard(orderData.orderId, 'Order ID')}
                                >
                                    <ThemedText style={[styles.detailValue, { color: textColor }]}>
                                        {orderData.orderId}
                                    </ThemedText>
                                    <IconSymbol name="doc.on.doc" size={16} color={Palette.primary} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.detailRow}>
                                <ThemedText style={[styles.detailLabel, { color: secondaryTextColor }]}>
                                    Status:
                                </ThemedText>
                                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(orderData.status)}20` }]}>
                                    <IconSymbol 
                                        name={getStatusIcon(orderData.status)} 
                                        size={14} 
                                        color={getStatusColor(orderData.status)} 
                                    />
                                    <ThemedText style={[styles.statusText, { color: getStatusColor(orderData.status) }]}>
                                        {orderData.status.toUpperCase()}
                                    </ThemedText>
                                </View>
                            </View>

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
                                    Quantity:
                                </ThemedText>
                                <ThemedText style={[styles.detailValue, { color: textColor }]}>
                                    {orderData.quantity}
                                </ThemedText>
                            </View>

                            <View style={styles.detailRow}>
                                <ThemedText style={[styles.detailLabel, { color: secondaryTextColor }]}>
                                    Amount Paid:
                                </ThemedText>
                                <ThemedText style={[styles.detailValue, { color: Palette.primary }]}>
                                    {formatCurrency(orderData.totalAmount)}
                                </ThemedText>
                            </View>

                            <View style={styles.detailRow}>
                                <ThemedText style={[styles.detailLabel, { color: secondaryTextColor }]}>
                                    Email:
                                </ThemedText>
                                <TouchableOpacity 
                                    style={styles.copyableValue}
                                    onPress={() => copyToClipboard(orderData.email, 'Email')}
                                >
                                    <ThemedText style={[styles.detailValue, { color: textColor }]} numberOfLines={2}>
                                        {orderData.email}
                                    </ThemedText>
                                    <IconSymbol name="doc.on.doc" size={16} color={Palette.primary} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.detailRow}>
                                <ThemedText style={[styles.detailLabel, { color: secondaryTextColor }]}>
                                    Social Link:
                                </ThemedText>
                                <TouchableOpacity 
                                    style={styles.copyableValue}
                                    onPress={() => copyToClipboard(orderData.socialAccountLink, 'Social account link')}
                                >
                                    <ThemedText style={[styles.detailValue, { color: textColor }]} numberOfLines={2}>
                                        {orderData.socialAccountLink}
                                    </ThemedText>
                                    <IconSymbol name="doc.on.doc" size={16} color={Palette.primary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Next Steps */}
                    <View style={[styles.card, { backgroundColor: cardBg }]}>
                        <View style={styles.cardHeader}>
                            <IconSymbol name="lightbulb" size={24} color={Palette.info} />
                            <ThemedText style={[styles.cardTitle, { color: textColor }]}>
                                What's Next?
                            </ThemedText>
                        </View>

                        <View style={styles.stepsContainer}>
                            <View style={styles.stepItem}>
                                <View style={[styles.stepNumber, { backgroundColor: Palette.primary }]}>
                                    <ThemedText style={styles.stepNumberText}>1</ThemedText>
                                </View>
                                <View style={styles.stepContent}>
                                    <ThemedText style={[styles.stepTitle, { color: textColor }]}>
                                        Check Your Email
                                    </ThemedText>
                                    <ThemedText style={[styles.stepDescription, { color: secondaryTextColor }]}>
                                        Account login details will be sent to {orderData.email} instantly
                                    </ThemedText>
                                </View>
                            </View>

                            <View style={styles.stepItem}>
                                <View style={[styles.stepNumber, { backgroundColor: Palette.primary }]}>
                                    <ThemedText style={styles.stepNumberText}>2</ThemedText>
                                </View>
                                <View style={styles.stepContent}>
                                    <ThemedText style={[styles.stepTitle, { color: textColor }]}>
                                        Download from Dashboard
                                    </ThemedText>
                                    <ThemedText style={[styles.stepDescription, { color: secondaryTextColor }]}>
                                        You can also download account details from your dashboard
                                    </ThemedText>
                                </View>
                            </View>

                            <View style={styles.stepItem}>
                                <View style={[styles.stepNumber, { backgroundColor: Palette.primary }]}>
                                    <ThemedText style={styles.stepNumberText}>3</ThemedText>
                                </View>
                                <View style={styles.stepContent}>
                                    <ThemedText style={[styles.stepTitle, { color: textColor }]}>
                                        Start Growing
                                    </ThemedText>
                                    <ThemedText style={[styles.stepDescription, { color: secondaryTextColor }]}>
                                        Use your new accounts to boost your social media presence
                                    </ThemedText>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Important Notice */}
                    <View style={[styles.noticeCard, { backgroundColor: `${Palette.warning}20`, borderColor: Palette.warning }]}>
                        <IconSymbol name="exclamationmark.triangle.fill" size={20} color={Palette.warning} />
                        <View style={styles.noticeContent}>
                            <ThemedText style={[styles.noticeTitle, { color: Palette.warning }]}>
                                Important Notice
                            </ThemedText>
                            <ThemedText style={[styles.noticeText, { color: textColor }]}>
                                Please check your email spam/promotions folder if you don't see the account details in your inbox.
                            </ThemedText>
                        </View>
                    </View>
                </ScrollView>

                {/* Footer */}
                <View style={[styles.footer, { backgroundColor: cardBg, borderTopColor: borderColor }]}>
                    <View style={styles.buttonContainer}>
                        <AppButton
                            title="New Order"
                            onPress={handleNewOrder}
                            variant={isDark ? 'dark' : 'white'}
                            style={styles.newOrderButton}
                        />
                        <AppButton
                            title="Go Home"
                            onPress={handleGoHome}
                            variant="dark"
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
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        fontFamily: 'Belgrano-Regular',
    },
    placeholder: {
        width: 40,
    },
    closeButton: {
        padding: 8,
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
    copyableValue: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1.5,
        justifyContent: 'flex-end',
        gap: 8,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
    },
    stepsContainer: {
        gap: 20,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    stepNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    stepNumberText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    stepContent: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    stepDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    noticeCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginVertical: 8,
    },
    noticeContent: {
        flex: 1,
        marginLeft: 12,
    },
    noticeTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    noticeText: {
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
    newOrderButton: {
        flex: 1,
    },
    homeButton: {
        flex: 1,
    },
});
