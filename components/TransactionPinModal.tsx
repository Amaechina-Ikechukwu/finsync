import React, { useEffect, useState } from 'react';
import {
    Modal,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

import { useNotification } from '@/components/InAppNotificationProvider';
import Keypad from '@/components/security/Keypad';
import { ThemedText } from '@/components/ThemedText';
import AppButton from '@/components/ui/AppButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface TransactionPinModalProps {
    visible: boolean;
    onClose?: () => void;
    onPinEntered: (pin: string) => void;
    isProcessing?: boolean;
    title?: string;
    subtitle?: string;
    allowCancel?: boolean;
}

export default function TransactionPinModal({
    visible,
    onClose,
    onPinEntered,
    isProcessing = false,
    title = "Enter Transaction PIN",
    subtitle = "Please enter your 4-digit transaction PIN to continue",
    allowCancel = true
}: TransactionPinModalProps) {
    const colorScheme = useColorScheme();
    const { showNotification } = useNotification();
    const [pin, setPin] = useState('');

    // Colors based on theme
    const backgroundColor = colorScheme === 'dark' ? Palette.black : Palette.white;
    const cardBackground = colorScheme === 'dark' ? Palette.lighterBlack : '#f8f9fa';
    const borderColor = colorScheme === 'dark' ? Palette.grayDark : '#e5e7eb';
    const textColor = colorScheme === 'dark' ? Palette.white : Palette.text;
    const secondaryTextColor = colorScheme === 'dark' ? Palette.gray : '#6b7280';

    // Reset PIN when modal opens/closes
    useEffect(() => {
        if (!visible) {
            setPin('');
        }
    }, [visible]);

    const handlePinChange = (value: string) => {
        // Only allow numbers and limit to 4 digits
        const numericValue = value.replace(/[^0-9]/g, '').slice(0, 4);
        setPin(numericValue);
    };

    const handleSubmit = (override?: string) => {
        const value = override ?? pin;
        if (value.length !== 4) {
            showNotification('Please enter a 4-digit PIN', 'error');
            return;
        }
        onPinEntered(value);
    };

    const handleCancel = () => {
        if (!allowCancel) return;
    setPin('');
        if (onClose) {
            onClose();
        }
    };

    const onSubmitAuto = (val: string) => {
        if (val.length === 4) handleSubmit(val); // use immediate value to avoid state lag
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={allowCancel ? handleCancel : undefined}
        >
            <View style={styles.overlay}>
                <View style={[styles.modalContainer, { backgroundColor }]}>
                    <View style={styles.modalContent}>
                        <View style={styles.header}>
                            <ThemedText style={[styles.title, { color: textColor }]}>
                                {title}
                            </ThemedText>
                            {allowCancel && (
                                <TouchableOpacity
                                    onPress={handleCancel}
                                    style={styles.closeButton}
                                    disabled={isProcessing}
                                >
                                    <IconSymbol name="xmark" size={24} color={textColor} />
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={styles.body}>
                            <ThemedText style={[styles.subtitle, { color: secondaryTextColor }]}>
                                {subtitle}
                            </ThemedText>
                            <View style={{ alignItems: 'center', marginTop: 8 }}>
                                <Keypad
                                    value={pin}
                                    onChange={handlePinChange}
                                    onSubmit={onSubmitAuto}
                                    maxLength={4}
                                />
                            </View>
                        </View>

                        <View style={styles.footer}>
                            <AppButton
                                title={isProcessing ? "Processing..." : "Continue"}
                                onPress={() => handleSubmit()}
                                variant="dark"
                                disabled={pin.length !== 4 || isProcessing}
                                loading={isProcessing}
                                style={styles.continueButton}
                            />
                            
                            {allowCancel && (
                                <TouchableOpacity
                                    onPress={handleCancel}
                                    style={styles.cancelButton}
                                    disabled={isProcessing}
                                >
                                    <ThemedText style={[styles.cancelText, { color: secondaryTextColor }]}>
                                        Cancel
                                    </ThemedText>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    modalContent: {
        paddingHorizontal: 24,
        paddingVertical: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        fontFamily: 'Belgrano-Regular',
        flex: 1,
    },
    closeButton: {
        padding: 4,
    },
    body: {
        marginBottom: 24,
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    // Removed text input + eye toggle in favor of keypad and masked dots
    footer: {
        alignItems: 'center',
    },
    continueButton: {
        width: '100%',
        marginBottom: 12,
    },
    cancelButton: {
        paddingVertical: 12,
    },
    cancelText: {
        fontSize: 16,
        textAlign: 'center',
    },
});
