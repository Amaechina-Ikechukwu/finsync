import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BankSelectionModal from '@/components/BankSelectionModal';
import { useNotification } from '@/components/InAppNotificationProvider';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import FSActivityLoader from '@/components/ui/FSActivityLoader';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';
import { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Bank, transferService } from '@/services/apiService';
import { useAppStore } from '@/store';

interface SelectedBank {
    id: number;
    name: string;
    code: string;
}

interface VerifiedAccount {
    account_number: string;
    account_name: string;
    bank_id: number;
}

export default function TransfersScreen() {
    const colorScheme = useColorScheme();
    const { showNotification } = useNotification();
    const { userData } = useAppStore();
    
    const [banks, setBanks] = useState<Bank[]>([]);
    const [selectedBank, setSelectedBank] = useState<SelectedBank | null>(null);
    const [showBankList, setShowBankList] = useState(false);
    const [accountNumber, setAccountNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [verifiedAccount, setVerifiedAccount] = useState<VerifiedAccount | null>(null);
    const [isLoadingBanks, setIsLoadingBanks] = useState(false);
    const [isVerifyingAccount, setIsVerifyingAccount] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Colors based on theme
    const backgroundColor = colorScheme === 'dark' ? Palette.black : Palette.white;
    const cardBackground = colorScheme === 'dark' ? Palette.lighterBlack : '#f8f9fa';
    const borderColor = colorScheme === 'dark' ? Palette.grayDark : '#e5e7eb';
    const textColor = colorScheme === 'dark' ? Palette.white : Palette.text;
    const secondaryTextColor = colorScheme === 'dark' ? Palette.gray : '#6b7280';

    // Get beneficiary data from router params
    const { 
        beneficiaryAccountNumber,
        beneficiaryBankName,
        beneficiaryBankCode,
        beneficiaryName
    } = useLocalSearchParams<{ 
        beneficiaryAccountNumber: string;
        beneficiaryBankName: string;
        beneficiaryBankCode: string;
        beneficiaryName: string;
    }>();

    // Load banks on component mount
    useEffect(() => {
        loadBanks();
    }, []);

    // Auto-populate beneficiary data if available
    useEffect(() => {
        
        if (beneficiaryAccountNumber && beneficiaryBankName && beneficiaryName && banks.length > 0) {
            setAccountNumber(beneficiaryAccountNumber);
            
            // Find and select the bank by bank code first, then fallback to bank name
            let bank = null;
            
            if (beneficiaryBankCode) {
                bank = banks.find(b => b.code === beneficiaryBankCode);
            }
            
            // If not found by code or no code provided, try to find by name
            if (!bank && beneficiaryBankName) {
                bank = banks.find(b => 
                    b.name.toLowerCase().includes(beneficiaryBankName.toLowerCase()) ||
                    beneficiaryBankName.toLowerCase().includes(b.name.toLowerCase())
                );
            }
            
            if (bank) {
                setSelectedBank({
                    id: bank.id,
                    name: bank.name,
                    code: bank.code
                });
                showNotification(`Auto-filled data for ${beneficiaryName}`, 'success');
            } else {
                // Still set account number even if bank is not found
                showNotification(`Auto-filled account number for ${beneficiaryName}. Please select ${beneficiaryBankName} manually.`, 'info');
            }
        }
    }, [beneficiaryAccountNumber, beneficiaryBankName, beneficiaryBankCode, beneficiaryName, banks]);

    // Auto-verify account when 10 digits are entered
    useEffect(() => {
        if (accountNumber.length === 10 && selectedBank && !isVerifyingAccount) {
            verifyAccount();
        } else if (accountNumber.length !== 10) {
            setVerifiedAccount(null);
        }
    }, [accountNumber, selectedBank]);

    const loadBanks = async () => {
        setIsLoadingBanks(true);
        showNotification('Loading banks', 'info');
        try {
            const response = await transferService.getBanks();
            if (response.success && response.data) {
                // Filter only active banks that support transfers
                const activeBanks = response.data.filter((bank: Bank) => 
                    bank.active && bank.supports_transfer && !bank.is_deleted
                );
                setBanks(activeBanks);
            } else {
                showNotification(response.message || 'Failed to load banks', 'error');
            }
        } catch (error) {
            console.error('Error loading banks:', error);
            showNotification('Failed to load banks. Please try again.', 'error');
        } finally {
            setIsLoadingBanks(false);
        }
    };

    const verifyAccount = async () => {
        if (!selectedBank || accountNumber.length !== 10) return;
        showNotification('Checking account', 'info');
        setIsVerifyingAccount(true);
        try {
            const response = await transferService.verifyAccount({
                account_number: accountNumber,
                bank_code: selectedBank.code
            });
            if (response.success && response.data) {
                setVerifiedAccount(response.data);
                showNotification('Account verified successfully', 'success');
            } else {
                setVerifiedAccount(null);
                showNotification(response.message || 'Failed to verify account', 'error');
            }
        } catch (error) {
            console.error('Error verifying account:', error);
            setVerifiedAccount(null);
            showNotification('Failed to verify account. Please try again.', 'error');
        } finally {
            setIsVerifyingAccount(false);
        }
    };

    const handleBankSelect = (bank: Bank) => {
        setSelectedBank({
            id: bank.id,
            name: bank.name,
            code: bank.code
        });
        setShowBankList(false);
        setVerifiedAccount(null);
        // Don't clear account number or amount when bank changes
        // The user might want to keep the same values and just change the bank
    };



    const handleAmountChange = (value: string) => {
        // Remove any non-numeric characters except decimal point
        const cleanedValue = value.replace(/[^0-9.]/g, '');
        
        // Prevent multiple decimal points
        if (cleanedValue.split('.').length > 2) {
            return;
        }
        
        // Limit to 2 decimal places
        const parts = cleanedValue.split('.');
        if (parts[1] && parts[1].length > 2) {
            return;
        }
        
        setAmount(cleanedValue);
        
        // Real-time validation for amount exceeding balance
        if (cleanedValue && cleanedValue !== '') {
            const numericValue = parseFloat(cleanedValue);
            if (!isNaN(numericValue) && numericValue > userData.amount) {
                showNotification(`Amount exceeds available balance: ${formatCurrency(userData.amount)}`, 'error');
            }
        }
    };

    const formatAmountDisplay = (value: string): string => {
        if (!value || value === '') return '';
        const numericValue = parseFloat(value);
        if (isNaN(numericValue)) return '';
        return `₦${numericValue.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        })}`;
    };

    const formatCurrency = (value: number): string => {
        return `₦${value.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const handleContinue = () => {
        if (!selectedBank || !verifiedAccount) {
            showNotification('Please select a bank and verify account', 'info');
            return;
        }
        
        if (!amount || amount.trim() === '') {
            showNotification('Please enter an amount', 'info');
            return;
        }
        
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            showNotification('Please enter a valid amount', 'error');
            return;
        }
        
        if (numericAmount > userData.amount) {
            showNotification(`Insufficient funds. Available balance: ${formatCurrency(userData.amount)}`, 'error');
            return;
        }
        
        // Navigate to next step with the verified account details
        router.push({
            pathname: '/transfers/transferconfirmation',
            params: {
                bankName: selectedBank.name,
                bankCode: selectedBank.code,
                accountNumber: verifiedAccount.account_number,
                accountName: verifiedAccount.account_name,
                bankId: verifiedAccount.bank_id.toString(),
                amount: amount
            }
        });
        
        // showNotification(`Transfer of ${formatCurrency(parseFloat(amount))} to ${verifiedAccount.account_name} is ready for confirmation`, 'success');
    };

    // Filter banks based on search query
    const filteredBanks = banks.filter(bank =>
        bank.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['left', 'right', 'bottom']}> 
            <KeyboardAvoidingView
                style={styles.keyboardAvoiding}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
            >
                       
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="always"
                    keyboardDismissMode={Platform.OS === 'ios' ? 'on-drag' : 'interactive'}
                    contentInsetAdjustmentBehavior="automatic"
                >
                    <View style={[styles.header, { borderBottomColor: borderColor }]}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backButton}
                        >
                            <IconSymbol name="chevron.left" size={24} color={textColor} />
                        </TouchableOpacity>
                        <ThemedText style={[styles.headerTitle, { color: textColor }]}>
                            Bank Transfer
                        </ThemedText>
                        <View style={styles.headerSpacer} />
                    </View>

                    <ThemedView style={[styles.content, { backgroundColor }]}>
                        <View style={styles.section}>
                            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                                Select Bank
                            </ThemedText>
                            
                            <TouchableOpacity
                                style={[styles.bankSelector, { backgroundColor: cardBackground, borderColor }]}
                                onPress={() => setShowBankList(true)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.bankSelectorContent}>
                                    {selectedBank ? (
                                        <>
                                            <View style={[styles.bankIcon, { backgroundColor: Palette.primary + '20' }]}>
                                                <IconSymbol name="building.2.fill" size={20} color={Palette.primary} />
                                            </View>
                                            <View style={styles.bankDetails}>
                                                <ThemedText style={[styles.selectedBankName, { color: textColor }]}>
                                                    {selectedBank.name}
                                                </ThemedText>
                                              
                                            </View>
                                        </>
                                    ) : (
                                        <ThemedText style={[styles.placeholderText, { color: secondaryTextColor }]}>
                                            Choose a bank
                                        </ThemedText>
                                    )}
                                    <IconSymbol name="chevron.right" size={20} color={secondaryTextColor} />
                                </View>
                            </TouchableOpacity>
                        </View>

                        {selectedBank && (
                            <View style={styles.section}>
                                <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                                    Account Number
                                </ThemedText>
                                
                                <ThemedTextInput
                                    placeholder="Enter 10-digit account number"
                                    value={accountNumber}
                                    onChangeText={setAccountNumber}
                                    keyboardType="numeric"
                                    maxLength={10}
                                    style={[styles.accountInput,{backgroundColor:colorScheme=='light'?Palette.white:Palette.black}]}
                                />

                                {isVerifyingAccount && (
                                    <View style={styles.verifyingContainer}>
                                        <FSActivityLoader />
                                        <ThemedText style={[styles.verifyingText, { color: secondaryTextColor }]}>
                                            Verifying account...
                                        </ThemedText>
                                    </View>
                                )}

                                {verifiedAccount && (
                                    <View style={[styles.verifiedCard, { backgroundColor: Palette.success + '10', borderColor: Palette.success }]}>
                                        <View style={styles.verifiedHeader}>
                                            <IconSymbol name="checkmark.circle.fill" size={20} color={Palette.success} />
                                            <ThemedText style={[styles.verifiedTitle, { color: Palette.success }]}>
                                                Account Verified
                                            </ThemedText>
                                        </View>
                                        <ThemedText style={[styles.accountName, { color: textColor }]}>
                                            {verifiedAccount.account_name}
                                        </ThemedText>
                                        <ThemedText style={[styles.accountDetails, { color: secondaryTextColor }]}>
                                            {verifiedAccount.account_number} • {selectedBank.name}
                                        </ThemedText>
                                    </View>
                                )}
                            </View>
                        )}

                        {verifiedAccount && (
                            <View style={styles.section}>
                                <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                                    Transfer Amount
                                </ThemedText>
                                
                                <View style={styles.amountContainer}>
                                    <View style={styles.currencyPrefix}>
                                        <ThemedText style={[styles.currencySymbol, { color: textColor }]}>
                                            ₦
                                        </ThemedText>
                                    </View>
                                    <ThemedTextInput
                                        placeholder="0.00"
                                        value={amount}
                                        onChangeText={handleAmountChange}
                                        keyboardType="decimal-pad"
                                        style={[
                                            styles.amountInput,
                                            { 
                                                backgroundColor: colorScheme === 'light' ? Palette.white : Palette.black,
                                            }
                                        ]}
                                    />
                                </View>
                                
                                <View style={styles.balanceInfo}>
                                    <ThemedText style={[styles.balanceLabel, { color: secondaryTextColor }]}>
                                        Available balance: {formatCurrency(userData.amount)}
                                    </ThemedText>
                                    {amount && (
                                        <ThemedText style={[styles.amountPreview, { color: textColor }]}>
                                            Amount: {formatAmountDisplay(amount)}
                                        </ThemedText>
                                    )}
                                </View>
                            </View>
                        )}
                        
                    </ThemedView>
                        {selectedBank && verifiedAccount && amount && parseFloat(amount) > 0 && parseFloat(amount) <= userData.amount && (
                    <View style={[styles.footer, { backgroundColor }]}>                    
                        <AppButton
                            title="Continue"
                            onPress={handleContinue}
                            variant="dark"
                            style={styles.continueButton}
                        />
                    </View>
                )}
                </ScrollView>

            
            
            </KeyboardAvoidingView>

            {/* Bank Selection Modal */}
            <BankSelectionModal
                visible={showBankList}
                banks={banks}
                isLoading={isLoadingBanks}
                searchQuery={searchQuery}
                onClose={() => setShowBankList(false)}
                onBankSelect={handleBankSelect}
                onSearchChange={setSearchQuery}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    keyboardAvoiding: {
        flex: 1,
    },
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
     
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        fontFamily: 'Belgrano-Regular',
        flex: 1,
        textAlign: 'center',
        marginRight: 32, // Compensate for back button
    },
    headerSpacer: {
        width: 32,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Belgrano-Regular',
        marginBottom: 12,
    },
    bankSelector: {
        borderRadius: 12,
       
        padding: 16,
    },
    bankSelectorContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bankIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    bankDetails: {
        flex: 1,
    },
    selectedBankName: {
        fontSize: 16,
        fontWeight: '500',
        fontFamily: 'Belgrano-Regular',
    },
    selectedBankCode: {
        fontSize: 14,
        marginTop: 2,
    },
    placeholderText: {
        fontSize: 16,
        flex: 1,
    },
    accountInput: {
        marginBottom: 16,

    },
    verifyingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    verifyingText: {
        marginLeft: 8,
        fontSize: 14,
    },
    verifiedCard: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        marginTop: 8,
    },
    verifiedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    verifiedTitle: {
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 6,
    },
    accountName: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Belgrano-Regular',
        marginBottom: 4,
    },
    accountDetails: {
        fontSize: 14,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: 'transparent',
    },
    continueButton: {
        width: '100%',
    },
    // Amount input styles
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        backgroundColor: 'transparent',
    },
    currencyPrefix: {
        paddingRight: 8,
        paddingLeft: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    currencySymbol: {
        fontSize: 18,
        fontWeight: '600',
    },
    amountInput: {
        flex: 1,
        marginBottom: 0,
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'left',
        paddingLeft: 0,
    },
    balanceInfo: {
        marginBottom: 12,
        alignItems: 'center',
    },
    balanceLabel: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 4,
    },
    amountPreview: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
});


