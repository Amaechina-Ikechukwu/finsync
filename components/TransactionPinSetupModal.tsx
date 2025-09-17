import React, { useCallback, useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';
import { Palette } from '@/constants/Colors';
import { auth } from '@/firebase';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useNotification } from './InAppNotificationProvider';

interface TransactionPinSetupModalProps {
    visible: boolean;
    onPinSet?: (pin: string) => Promise<void>;
    onSuccess?: () => void;
    onClose?: () => void;
}

export default function TransactionPinSetupModal({
    visible,
    onPinSet,
    onSuccess,
    onClose
}: TransactionPinSetupModalProps) {
    const colorScheme = useColorScheme();
    const localNotification = useNotification();
    
    // State management
    const [currentStep, setCurrentStep] = useState<'enter' | 'confirm'>('enter');
    const [enteredPin, setEnteredPin] = useState('');
    const [confirmationPin, setConfirmationPin] = useState('');
    const [isApiLoading, setIsApiLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    // Theme colors
    const backgroundColor = colorScheme === 'dark' ? Palette.black : Palette.white;
    const cardBackground = colorScheme === 'dark' ? Palette.lighterBlack : '#f8f9fa';
    const borderColor = colorScheme === 'dark' ? Palette.grayDark : '#e5e7eb';
    const textColor = colorScheme === 'dark' ? Palette.white : Palette.text;
    const secondaryTextColor = colorScheme === 'dark' ? Palette.gray : '#6b7280';

    // Reset state when modal becomes visible
    useEffect(() => {
        if (visible) {
            setCurrentStep('enter');
            setEnteredPin('');
            setConfirmationPin('');
            setIsApiLoading(false);
            setApiError(null);
        }
    }, [visible]);

    // API function using direct fetch
    const callSetPinApi = useCallback(async (pin: string): Promise<{ success: boolean; error?: string }> => {
        
        try {
            // Get Firebase auth token
            const currentUser = auth.currentUser;
            if (!currentUser) {
                console.error('❌ No authenticated user found');
                return { success: false, error: 'No authenticated user' };
            }

            const token = await currentUser.getIdToken();

            const apiUrl = 'https://finsync-973931739764.europe-west1.run.app/api/transfers/set-transaction-pin';

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ pin }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ HTTP error:', response.status, errorText);
                return { 
                    success: false, 
                    error: `Server error (${response.status}): ${errorText || response.statusText}` 
                };
            }

            const responseData = await response.json();

            if (responseData.success) {
                return { success: true };
            } else {
                console.error('❌ API returned failure:', responseData);
                return { 
                    success: false, 
                    error: responseData.message || responseData.error || 'Unknown API error' 
                };
            }

        } catch (error) {
            console.error('❌ Network/fetch error:', error);
            return { 
                success: false, 
                error: error instanceof Error ? error.message : 'Network connection failed' 
            };
        }
    }, []);

    // Handle PIN input changes
    const handlePinInput = useCallback((value: string) => {
        const numericOnly = value.replace(/[^0-9]/g, '');
        const truncated = numericOnly.slice(0, 4);
        
        if (currentStep === 'enter') {
            setEnteredPin(truncated);
        } else {
            setConfirmationPin(truncated);
        }
    }, [currentStep]);

    // Handle continue button press
    const handleContinue = useCallback(async () => {
        
        if (currentStep === 'enter') {
            // Validate entered PIN
            if (enteredPin.length !== 4) {
                localNotification.showNotification('PIN must be exactly 4 digits', 'error');
                return;
            }
            
            localNotification.showNotification('Now confirm your PIN', 'info');
            setCurrentStep('confirm');
            return;
        }

        // Confirmation step - validate and submit
        if (confirmationPin.length !== 4) {
            localNotification.showNotification('Please confirm your 4-digit PIN', 'error');
            return;
        }

    if (enteredPin !== confirmationPin) {
            localNotification.showNotification('PINs do not match. Please try again.', 'error');
            setCurrentStep('enter');
            setEnteredPin('');
            setConfirmationPin('');
            return;
        }

        // PINs match - proceed with API call
        setIsApiLoading(true);
        setApiError(null);
        localNotification.showNotification('Setting your PIN...', 'info');

        try {
            const apiResult = await callSetPinApi(enteredPin);
            if (apiResult.success) {
                localNotification.showNotification('Transaction PIN set successfully!', 'success');
                // Close modal after success
                setTimeout(() => {
                    onSuccess?.();
                    onClose?.();
                }, 1500);
            } else {
                console.error('❌ API failed:', apiResult.error);
                setApiError(apiResult.error || 'Failed to set PIN');
                localNotification.showNotification(apiResult.error || 'Failed to set PIN', 'error');
            }

        } catch (error) {
            console.error('❌ Unexpected error during PIN setup:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unexpected error occurred';
            setApiError(errorMessage);
            localNotification.showNotification(errorMessage, 'error');
        } finally {
            setIsApiLoading(false);
        }
    }, [currentStep, enteredPin, confirmationPin, onPinSet, callSetPinApi, localNotification, onSuccess, onClose]);

    // Handle back button
    const handleBack = useCallback(() => {
        if (currentStep === 'confirm') {
            setCurrentStep('enter');
            setConfirmationPin('');
            setApiError(null);
        }
    }, [currentStep]);

    // Get current PIN value based on step
    const currentPinValue = currentStep === 'enter' ? enteredPin : confirmationPin;
    
    // Determine if continue button should be enabled
    const isContinueDisabled = currentPinValue.length !== 4 || isApiLoading;

    // Test API function for debugging
    const testApiConnection = useCallback(async () => {
        setIsApiLoading(true);
        
        const result = await callSetPinApi('12345');
        
        if (result.success) {
            localNotification.showNotification('API Test: Connection successful!', 'success');
        } else {
            localNotification.showNotification(`API Test Failed: ${result.error}`, 'error');
        }
        
        setIsApiLoading(false);
    }, [callSetPinApi, localNotification]);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => {
                // Prevent modal from closing on Android back button while API is loading
                if (!isApiLoading) {
                    onClose?.();
                }
            }}
        >
            <KeyboardAvoidingView 
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ThemedView style={[styles.modalContainer, { backgroundColor }]}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <SafeAreaView style={styles.modalContent}>
                            {/* Header */}
                            <View style={styles.header}>
                                <IconSymbol 
                                    name="lock" 
                                    size={48} 
                                    color={colorScheme === "light" ? Palette.black : Palette.white} 
                                />
                                <ThemedText style={[styles.title, { color: textColor }]}>
                                    {currentStep === 'enter' ? 'Set Transaction PIN' : 'Confirm Transaction PIN'}
                                </ThemedText>
                                <ThemedText style={[styles.subtitle, { color: secondaryTextColor }]}>
                                    {currentStep === 'enter' 
                                        ? 'Create a 4-digit PIN to secure your transactions'
                                        : 'Please re-enter your PIN to confirm'
                                    }
                                </ThemedText>
                            </View>

                            {/* Body */}
                            <View style={styles.body}>
                                {/* PIN Input */}
                                <View style={styles.inputContainer}>
                                    <ThemedTextInput
                                        placeholder={currentStep === 'enter' ? 'Enter 4-digit PIN' : 'Confirm your PIN'}
                                        value={currentPinValue}
                                        onChangeText={handlePinInput}
                                        keyboardType="numeric"
                                        maxLength={4}
                                        secureTextEntry={true}
                                        style={[styles.pinInput, { backgroundColor: cardBackground, borderColor }]}
                                        autoFocus={true}
                                        editable={!isApiLoading}
                                    />
                              
</View>
                               

                                {/* Requirements */}
                                {/* <View style={[styles.requirements, { backgroundColor: cardBackground, borderColor }]}>
                                    <ThemedText style={[styles.requirementsTitle, { color: textColor }]}>
                                        PIN Requirements:
                                    </ThemedText>
                                    <View style={styles.requirementItem}>
                                        <IconSymbol 
                                            name="checkmark.circle" 
                                            size={16} 
                                            color={currentPinValue.length === 5 ? Palette.success : secondaryTextColor} 
                                        />
                                        <ThemedText style={[styles.requirementText, { color: secondaryTextColor }]}>
                                            Must be exactly 5 digits
                                        </ThemedText>
                                    </View>
                                    <View style={styles.requirementItem}>
                                        <IconSymbol 
                                            name="checkmark.circle" 
                                            size={16} 
                                            color={/^\d+$/.test(currentPinValue) && currentPinValue.length > 0 ? Palette.success : secondaryTextColor} 
                                        />
                                        <ThemedText style={[styles.requirementText, { color: secondaryTextColor }]}>
                                            Numbers only
                                        </ThemedText>
                                    </View>
                                    {currentStep === 'confirm' && (
                                        <View style={styles.requirementItem}>
                                            <IconSymbol 
                                                name="checkmark.circle" 
                                                size={16} 
                                                color={enteredPin === confirmationPin && confirmationPin.length === 5 ? Palette.success : secondaryTextColor} 
                                            />
                                            <ThemedText style={[styles.requirementText, { color: secondaryTextColor }]}>
                                                PINs must match
                                            </ThemedText>
                                        </View>
                                    )}
                                </View> */}
                            </View>

                            {/* Footer */}
                            <View style={styles.footer}>
                                {/* Main Button */}
                                <AppButton
                                    title={currentStep === 'enter' ? "Continue" : (isApiLoading ? "Setting PIN..." : "Set PIN")}
                                    onPress={handleContinue}
                                    variant="dark"
                                    disabled={isContinueDisabled}
                                    loading={isApiLoading}
                                    style={styles.mainButton}
                                />
                                
                                {/* Back Button */}
                                {currentStep === 'confirm' && (
                                    <AppButton
                                        title="Back"
                                        onPress={handleBack}
                                        variant="outline"
                                        disabled={isApiLoading}
                                        style={styles.backButton}
                                    />
                                )}

                           

                            </View>
                        </SafeAreaView>
                    </ScrollView>
                </ThemedView>
                
            
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 400,
        maxHeight: '50%',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    modalContent: {
        paddingHorizontal: 24,
        paddingVertical: 32,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 24,
        fontWeight: '600',
        fontFamily: 'Belgrano-Regular',
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 16,
    },
    body: {
        marginBottom: 32,
    },
    inputContainer: {
        marginBottom: 24,
    },
    pinInput: {
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '600',
        letterSpacing: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 2,
    },
    pinDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        marginBottom: 24,
    },
    pinDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 16,
    },
    errorText: {
        fontSize: 14,
        marginLeft: 8,
        flex: 1,
        fontWeight: '500',
    },
    requirements: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    requirementsTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    requirementItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    requirementText: {
        fontSize: 14,
        marginLeft: 8,
        flex: 1,
    },
    footer: {
        gap: 12,
    },
    mainButton: {
        width: '100%',
    },
    backButton: {
        width: '100%',
    },
    testButton: {
        width: '100%',
    },
    cancelButton: {
        width: '100%',
    },
});
