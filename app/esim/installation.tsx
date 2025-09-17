import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function EsimInstallationScreen() {
    const colorScheme = useColorScheme();
    const params = useLocalSearchParams();
    const [activeStep, setActiveStep] = useState(0);
    
    // Extract QR code from params
    const qrCode = params.qr as string;
    
    // Colors based on theme
    const backgroundColor = colorScheme === 'dark' ? Palette.black : Palette.white;
    const cardBackground = colorScheme === 'dark' ? Palette.lighterBlack : '#f8f9fa';
    const borderColor = colorScheme === 'dark' ? Palette.grayDark : '#e5e7eb';
    const textColor = colorScheme === 'dark' ? Palette.white : Palette.text;
    const secondaryTextColor = colorScheme === 'dark' ? Palette.gray : '#6b7280';
    const primaryColor = colorScheme === 'dark' ? Palette.primary : Palette.primary;

    const installationSteps = [
        {
            title: "Check Device Compatibility",
            description: "Ensure your device supports eSIM and is unlocked",
            icon: "checkmark.circle",
            details: [
                "Your device must support eSIM technology",
                "Device should be carrier unlocked",
                "Check if your device model supports dual SIM",
                "Ensure you have iOS 12.1+ or Android 9+"
            ]
        },
        {
            title: "Connect to Wi-Fi",
            description: "Make sure you have a stable internet connection",
            icon: "wifi",
            details: [
                "Connect to a reliable Wi-Fi network",
                "Avoid using mobile data during installation",
                "Ensure strong signal strength",
                "Complete installation in one session"
            ]
        },
        {
            title: "Scan QR Code",
            description: "Use your device's camera to scan the eSIM QR code",
            icon: "qrcode",
            details: [
                "Open Settings > Cellular > Add Cellular Plan (iOS)",
                "Or Settings > Network & Internet > Mobile network (Android)",
                "Tap 'Add Cellular Plan' or similar option",
                "Point camera at the QR code below"
            ]
        },
        {
            title: "Complete Setup",
            description: "Follow the on-screen prompts to finish installation",
            icon: "gear",
            details: [
                "Choose a label for your eSIM line",
                "Select which line to use for data",
                "Configure cellular data options",
                "Test the connection once setup is complete"
            ]
        }
    ];

    const handleBack = () => {
        router.back();
    };

    const handleContactSupport = () => {
        Alert.alert(
            "Contact Support",
            "Need help with installation?",
            [
                {
                    text: "Email Support",
                    onPress: () => Linking.openURL("mailto:support@finsync.com?subject=eSIM Installation Help")
                },
                {
                    text: "Call Support", 
                    onPress: () => Linking.openURL("tel:+2348012345678")
                },
                {
                    text: "Cancel",
                    style: "cancel"
                }
            ]
        );
    };

    const handleStepPress = (index: number) => {
        setActiveStep(index === activeStep ? -1 : index);
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
                        onPress={handleBack}
                        style={styles.backButtonHeader}
                    >
                        <Ionicons name="chevron-back" size={24} color={textColor} />
                    </TouchableOpacity>
                    <ThemedText style={[styles.headerTitle, { color: textColor }]}>
                        eSIM Installation
                    </ThemedText>
                    <View style={styles.headerSpacer} />
                </View>

                <ThemedView style={[styles.content, { backgroundColor }]}>
                    {/* Header Message */}
                    <View style={styles.introContainer}>
                        <View style={[styles.introIcon, { backgroundColor: `${primaryColor}20` }]}>
                            <Ionicons name="qr-code" size={32} color={primaryColor} />
                        </View>
                        <ThemedText style={[styles.introTitle, { color: textColor }]}>
                            Install Your eSIM
                        </ThemedText>
                        <ThemedText style={[styles.introMessage, { color: secondaryTextColor }]}>
                            Follow these steps to install your eSIM and start using your new data plan
                        </ThemedText>
                    </View>

                    {/* QR Code Section */}
                    {qrCode && (
                        <View style={[styles.qrContainer, { backgroundColor: cardBackground, borderColor }]}>
                            <ThemedText style={[styles.qrTitle, { color: textColor }]}>
                                Your eSIM QR Code
                            </ThemedText>
                            <View style={[styles.qrCodeBox, { backgroundColor: Palette.white }]}>
                                {/* In a real app, you'd use a QR code library to render the actual QR code */}
                                <View style={styles.qrPlaceholder}>
                                    <Ionicons name="qr-code" size={80} color={Palette.black} />
                                    <ThemedText style={[styles.qrPlaceholderText, { color: Palette.black }]}>
                                        QR Code
                                    </ThemedText>
                                </View>
                            </View>
                            <ThemedText style={[styles.qrNote, { color: secondaryTextColor }]}>
                                Keep this QR code private and don't share it with others
                            </ThemedText>
                        </View>
                    )}

                    {/* Installation Steps */}
                    <View style={styles.stepsContainer}>
                        <ThemedText style={[styles.stepsTitle, { color: textColor }]}>
                            Installation Steps
                        </ThemedText>
                        
                        {installationSteps.map((step, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.stepCard,
                                    { backgroundColor: cardBackground, borderColor },
                                    activeStep === index && { borderColor: primaryColor }
                                ]}
                                onPress={() => handleStepPress(index)}
                            >
                                <View style={styles.stepHeader}>
                                    <View style={styles.stepNumber}>
                                        <ThemedText style={[styles.stepNumberText, { color: primaryColor }]}>
                                            {index + 1}
                                        </ThemedText>
                                    </View>
                                    <View style={styles.stepTitleContainer}>
                                        <ThemedText style={[styles.stepTitle, { color: textColor }]}>
                                            {step.title}
                                        </ThemedText>
                                        <ThemedText style={[styles.stepDescription, { color: secondaryTextColor }]}>
                                            {step.description}
                                        </ThemedText>
                                    </View>
                                    <Ionicons 
                                        name={activeStep === index ? "chevron-up" : "chevron-down"} 
                                        size={20} 
                                        color={secondaryTextColor} 
                                    />
                                </View>
                                
                                {activeStep === index && (
                                    <View style={styles.stepDetails}>
                                        {step.details.map((detail, detailIndex) => (
                                            <View key={detailIndex} style={styles.detailRow}>
                                                <View style={[styles.detailBullet, { backgroundColor: primaryColor }]} />
                                                <ThemedText style={[styles.detailText, { color: textColor }]}>
                                                    {detail}
                                                </ThemedText>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Help Section */}
                    <View style={[styles.helpContainer, { backgroundColor: cardBackground, borderColor }]}>
                        <View style={styles.helpHeader}>
                            <Ionicons name="help-circle" size={24} color={primaryColor} />
                            <ThemedText style={[styles.helpTitle, { color: textColor }]}>
                                Need Help?
                            </ThemedText>
                        </View>
                        <ThemedText style={[styles.helpText, { color: secondaryTextColor }]}>
                            If you encounter any issues during installation, our support team is here to help you.
                        </ThemedText>
                        <TouchableOpacity
                            style={[styles.supportButton, { borderColor: primaryColor }]}
                            onPress={handleContactSupport}
                        >
                            <Ionicons name="call" size={16} color={primaryColor} />
                            <ThemedText style={[styles.supportButtonText, { color: primaryColor }]}>
                                Contact Support
                            </ThemedText>
                        </TouchableOpacity>
                    </View>

                    {/* Important Notes */}
                    <View style={[styles.notesContainer, { backgroundColor: `${Palette.warning}20`, borderColor: Palette.warning }]}>
                        <View style={styles.notesHeader}>
                            <Ionicons name="warning" size={20} color={Palette.warning} />
                            <ThemedText style={[styles.notesTitle, { color: Palette.warning }]}>
                                Important Notes
                            </ThemedText>
                        </View>
                        <View style={styles.notesList}>
                            <ThemedText style={[styles.noteText, { color: textColor }]}>
                                • This QR code can only be used once for installation
                            </ThemedText>
                            <ThemedText style={[styles.noteText, { color: textColor }]}>
                                • Keep your device connected to Wi-Fi during setup
                            </ThemedText>
                            <ThemedText style={[styles.noteText, { color: textColor }]}>
                                • Installation may take a few minutes to complete
                            </ThemedText>
                            <ThemedText style={[styles.noteText, { color: textColor }]}>
                                • Restart your device if the eSIM doesn't activate immediately
                            </ThemedText>
                        </View>
                    </View>
                </ThemedView>
            </ScrollView>

            {/* Action Buttons */}
            <View style={[styles.footer, { backgroundColor, borderTopColor: borderColor }]}>
                <AppButton
                    title="Done"
                    onPress={handleBack}
                    variant={colorScheme === "dark" ? "white" : "dark"}
                    style={styles.doneButton}
                />
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
    introContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    introIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    introTitle: {
        fontSize: 24,
        fontWeight: '700',
        fontFamily: 'Belgrano-Regular',
        textAlign: 'center',
        marginBottom: 8,
    },
    introMessage: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 22,
    },
    qrContainer: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 20,
        alignItems: 'center',
        marginBottom: 32,
    },
    qrTitle: {
        fontSize: 18,
        fontWeight: '600',
        fontFamily: 'Belgrano-Regular',
        marginBottom: 16,
    },
    qrCodeBox: {
        width: 200,
        height: 200,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    qrPlaceholder: {
        alignItems: 'center',
    },
    qrPlaceholderText: {
        fontSize: 12,
        marginTop: 8,
        fontWeight: '500',
    },
    qrNote: {
        fontSize: 12,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    stepsContainer: {
        marginBottom: 32,
    },
    stepsTitle: {
        fontSize: 20,
        fontWeight: '600',
        fontFamily: 'Belgrano-Regular',
        marginBottom: 16,
    },
    stepCard: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        marginBottom: 12,
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: Palette.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    stepNumberText: {
        fontSize: 14,
        fontWeight: '600',
    },
    stepTitleContainer: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    stepDescription: {
        fontSize: 14,
        lineHeight: 18,
    },
    stepDetails: {
        marginTop: 16,
        paddingLeft: 48,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    detailBullet: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginTop: 8,
        marginRight: 12,
    },
    detailText: {
        fontSize: 14,
        flex: 1,
        lineHeight: 20,
    },
    helpContainer: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 20,
        marginBottom: 20,
    },
    helpHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    helpTitle: {
        fontSize: 18,
        fontWeight: '600',
        fontFamily: 'Belgrano-Regular',
        marginLeft: 8,
    },
    helpText: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    supportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        gap: 8,
    },
    supportButtonText: {
        fontSize: 14,
        fontWeight: '500',
    },
    notesContainer: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        marginBottom: 20,
    },
    notesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    notesTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    notesList: {
        gap: 8,
    },
    noteText: {
        fontSize: 14,
        lineHeight: 20,
    },
    footer: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderTopWidth: 1,
    },
    doneButton: {
        width: '100%',
    },
});
