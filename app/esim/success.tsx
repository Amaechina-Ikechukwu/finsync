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
import { useAppStore } from '@/store';

export default function EsimSuccessScreen() {
    const colorScheme = useColorScheme();
    const params = useLocalSearchParams();
    const { userData } = useAppStore();
    const notification = useNotification();
    
    // Extract eSIM purchase details from params
    const packageTitle = params.packageTitle as string;
    const packagePrice = params.packagePrice as string;
    const country = params.country as string;
    const operatorName = params.operatorName as string;
    const packageData = params.packageData as string;
    const packageDays = params.packageDays as string;
    const orderReference = params.orderReference as string;
    const qrCode = params.qrCode as string;

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

    const handleDone = () => {
        // Navigate back to main screen
        router.push('/(tabs)');
    };

    const handleNewPurchase = () => {
        // Navigate to eSIM countries screen
        router.push('/esim');
    };

    const handleViewDetails = () => {
        // Navigate to eSIM details or installation guide
        if (qrCode) {
            // Could navigate to a detailed installation screen
            router.push(`/esim/installation?qr=${encodeURIComponent(qrCode)}`);
        }
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
                        Purchase Complete
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
                            eSIM Purchase Successful!
                        </ThemedText>
                        <ThemedText style={[styles.successMessage, { color: secondaryTextColor }]}>
                            Your eSIM has been purchased and is ready for installation
                        </ThemedText>
                    </View>

                    {/* Package Details */}
                    <View style={[styles.detailsCard, { backgroundColor: cardBackground, borderColor }]}>
                        <ThemedText style={[styles.detailsTitle, { color: textColor }]}>
                            Package Details
                        </ThemedText>
                        
                        <View style={styles.detailRow}>
                            <ThemedText style={[styles.detailLabel, { color: secondaryTextColor }]}>
                                Package
                            </ThemedText>
                            <ThemedText style={[styles.detailValue, { color: textColor }]}>
                                {packageTitle}
                            </ThemedText>
                        </View>

                        <View style={styles.detailRow}>
                            <ThemedText style={[styles.detailLabel, { color: secondaryTextColor }]}>
                                Data Allowance
                            </ThemedText>
                            <ThemedText style={[styles.detailValue, { color: textColor }]}>
                                {packageData}
                            </ThemedText>
                        </View>

                        <View style={styles.detailRow}>
                            <ThemedText style={[styles.detailLabel, { color: secondaryTextColor }]}>
                                Validity
                            </ThemedText>
                            <ThemedText style={[styles.detailValue, { color: textColor }]}>
                                {packageDays} days
                            </ThemedText>
                        </View>

                        <View style={[styles.detailRow, styles.totalRow]}>
                            <ThemedText style={[styles.detailLabel, styles.totalLabel, { color: textColor }]}>
                                Amount Paid
                            </ThemedText>
                            <ThemedText style={[styles.detailValue, styles.totalValue, { color: textColor }]}>
                                {formatCurrency(packagePrice)}
                            </ThemedText>
                        </View>
                    </View>

                    {/* Operator Information */}
                    <View style={[styles.operatorCard, { backgroundColor: cardBackground, borderColor }]}>
                        <View style={styles.operatorHeader}>
                            <IconSymbol name="network" size={24} color={successColor} />
                            <ThemedText style={[styles.operatorTitle, { color: textColor }]}>
                                Network Provider
                            </ThemedText>
                        </View>

                        <View style={styles.operatorDetails}>
                            <ThemedText style={[styles.operatorName, { color: textColor }]}>
                                {operatorName}
                            </ThemedText>
                            <ThemedText style={[styles.operatorInfo, { color: secondaryTextColor }]}>
                                {country.toUpperCase()} • eSIM Network
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
                                Order Reference
                            </ThemedText>
                            <ThemedText style={[styles.transactionValue, { color: textColor }]}>
                                {orderReference || 'ESIM-' + Date.now()}
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

                    {/* Installation Notice */}
                    <View style={[styles.noticeCard, { backgroundColor: `${Palette.warning}20`, borderColor: Palette.warning }]}>
                        <View style={styles.noticeHeader}>
                            <IconSymbol name="exclamationmark.triangle" size={20} color={Palette.warning} />
                            <ThemedText style={[styles.noticeTitle, { color: Palette.warning }]}>
                                Installation Required
                            </ThemedText>
                        </View>
                        <ThemedText style={[styles.noticeText, { color: textColor }]}>
                            Please check your email for QR code and installation instructions. You'll need to install this eSIM on your device to start using it.
                        </ThemedText>
                    </View>

                    {/* Installation Guide Button */}
                    {qrCode && (
                        <TouchableOpacity
                            style={[styles.guideButton, { backgroundColor: cardBackground, borderColor }]}
                            onPress={handleViewDetails}
                        >
                            <IconSymbol name="qr.code" size={20} color={textColor} />
                            <ThemedText style={[styles.guideText, { color: textColor }]}>
                                View Installation Guide
                            </ThemedText>
                        </TouchableOpacity>
                    )}
                </ThemedView>
            </ScrollView>

            {/* Action Buttons */}
            <View style={[styles.footer, { backgroundColor, borderTopColor: borderColor }]}>
                <View style={styles.buttonContainer}>
                    <AppButton
                        title="Buy Another eSIM"
                        onPress={handleNewPurchase}
                        variant="outline"
                        style={styles.newPurchaseButton}
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
        flex: 1,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '500',
        flex: 1,
        textAlign: 'right',
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
    operatorCard: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 20,
        marginBottom: 20,
    },
    operatorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    operatorTitle: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Belgrano-Regular',
        marginLeft: 8,
    },
    operatorDetails: {
        paddingLeft: 32,
    },
    operatorName: {
        fontSize: 18,
        fontWeight: '600',
        fontFamily: 'Belgrano-Regular',
        marginBottom: 4,
    },
    operatorInfo: {
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
    noticeCard: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        marginBottom: 20,
    },
    noticeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    noticeTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    noticeText: {
        fontSize: 14,
        lineHeight: 20,
    },
    guideButton: {
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
    guideText: {
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
    newPurchaseButton: {
        flex: 1,
    },
    doneButton: {
        flex: 1,
    },
});
