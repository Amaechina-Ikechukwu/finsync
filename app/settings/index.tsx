import { router, type Href } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNotification } from '@/components/InAppNotificationProvider';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol, IconSymbolName } from '@/components/ui/IconSymbol';
import { Palette } from '@/constants/Colors';
import { useSession } from '@/hooks/useAuth';
import { useColorScheme } from '@/hooks/useColorScheme';
import { accountService } from '@/services/apiService';
import { useAppStore } from '@/store';
import { getAutoBiometricsEnabled, getBiometricsEnabled, setBiometricsEnabled } from '@/utils/security';

interface SettingsItem {
    id: string;
    title: string;
    subtitle?: string;
    icon: IconSymbolName;
    type: 'navigation' | 'toggle' | 'action';
    value?: boolean;
    onPress?: () => void;
    onToggle?: (value: boolean) => void;
    showBadge?: boolean;
    badgeText?: string;
    badgeColor?: string;
    destructive?: boolean;
}

export default function SettingsScreen() {
    const colorScheme = useColorScheme();
    const { showNotification } = useNotification();
    const { userData } = useAppStore();
    const { signOut } = useSession();
    
    // Settings state
    const [notifications, setNotifications] = useState(true);
    const [biometrics, setBiometrics] = useState(false);
    const [autoBiometrics, setAutoBiometrics] = useState(false);
    const [transactionAlerts, setTransactionAlerts] = useState(true);
    const [marketingEmails, setMarketingEmails] = useState(false);
    const [darkMode, setDarkMode] = useState(colorScheme === 'dark');
    const [identityStatus, setIdentityStatus] = useState<{
        submitted: boolean;
        verified: boolean;
        submittedAt?: number;
        hasNinFront?: boolean;
        hasNinBack?: boolean;
    } | null>(null);

    // Colors based on theme
    const backgroundColor = colorScheme === 'dark' ? Palette.black : Palette.white;
    const cardBackground = colorScheme === 'dark' ? Palette.lighterBlack : '#f8f9fa';
    const borderColor = colorScheme === 'dark' ? Palette.grayDark : '#e5e7eb';
    const textColor = colorScheme === 'dark' ? Palette.white : Palette.text;
    const secondaryTextColor = colorScheme === 'dark' ? Palette.gray : '#6b7280';

    useEffect(() => {
        // Load biometrics settings
        (async () => {
            try {
                const enabled = await getBiometricsEnabled();
                const auto = await getAutoBiometricsEnabled();
                setBiometrics(enabled);
                setAutoBiometrics(auto);
            } catch (e) {}
        })();
    }, []);

    useEffect(() => {
        // Fetch identity (KYC) status
        (async () => {
            const res = await accountService.getIdentityStatus();
            if (res.success && res.data) {
                setIdentityStatus(res.data);
            } else if (!res.success && res.message) {
                // Non-blocking notification
                showNotification(res.message, 'error');
            }
        })();
    }, []);

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: () => {
                        signOut();
                        showNotification('Logged out successfully', 'success');
                        router.replace('/auth/login');
                    }
                }
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'This action cannot be undone. All your data will be permanently deleted.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        showNotification('Account deletion requested. Our team will contact you within 24 hours.', 'info');
                    }
                }
            ]
        );
    };

    // Compute KYC badge text/color
    let kycBadgeText = 'Not Submitted';
    let kycBadgeColor = Palette.error;
    if (identityStatus) {
        if (identityStatus.verified) {
            kycBadgeText = 'Verified';
            kycBadgeColor = Palette.success;
        } else if (identityStatus.submitted) {
            kycBadgeText = 'Pending';
            kycBadgeColor = Palette.warning;
        }
    }

    const settingsSections: { title: string; items: SettingsItem[] }[] = [
        {
            title: 'Account',
            items: [
                {
                    id: 'referrals',
                    title: 'Refer & Earn',
                    subtitle: 'Get your referral code',
                    icon: 'gift',
                    type: 'navigation',
                    onPress: () => router.push('/settings/referrals' as Href)
                },
                // {
                //     id: 'profile',
                //     title: 'Profile Information',
                //     subtitle: 'Update your personal details',
                //     icon: 'person.circle.fill',
                //     type: 'navigation',
                //     onPress: () => showNotification('Profile screen coming soon', 'info')
                // },
                {
                    id: 'kyc',
                    title: 'KYC Verification',
                    subtitle: 'Complete your identity verification',
                    icon: 'checkmark.shield.fill',
                    type: 'navigation',
                    showBadge: true,
                    badgeText: kycBadgeText,
                    badgeColor: kycBadgeColor,
                    onPress: () => router.push('/settings/kyc-nin' as Href)
                },
                // {
                //     id: 'account-limits',
                //     title: 'Account Limits',
                //     subtitle: 'View your transaction limits',
                //     icon: 'chart.bar.fill',
                //     type: 'navigation',
                //     onPress: () => showNotification('Account limits screen coming soon', 'info')
                // }
            ]
        },
        {
            title: 'Security',
            items: [
                {
                    id: 'change-pin',
                    title: 'Change Transaction PIN',
                    subtitle: 'Update your 4-digit PIN',
                    icon: 'lock.fill',
                    type: 'navigation',
                    onPress: () => router.push('/settings/change-pin' as Href)
                },
                {
                    id: 'biometrics',
                    title: 'Biometric Authentication',
                    subtitle: 'Use fingerprint or face ID',
                    icon: 'faceid',
                    type: 'toggle',
                    value: biometrics,
                    onToggle: async (v: boolean) => {
                        try {
                            await setBiometricsEnabled(v);
                            setBiometrics(v);
                            showNotification(v ? 'Biometrics enabled' : 'Biometrics disabled', 'success');
                        } catch (e) {
                            showNotification('Failed to update biometrics', 'error');
                        }
                    }
                },
                // {
                //     id: 'auto-biometrics',
                //     title: 'Auto-use biometrics',
                //     subtitle: 'Prompt automatically on app open',
                //     icon: 'bolt.fill',
                //     type: 'toggle',
                //     value: autoBiometrics,
                //     onToggle: async (v: boolean) => {
                //         try {
                //             await setAutoBiometricsEnabled(v);
                //             setAutoBiometrics(v);
                //             showNotification(v ? 'Auto biometrics enabled' : 'Auto biometrics disabled', 'success');
                //         } catch (e) {
                //             showNotification('Failed to update auto biometrics', 'error');
                //         }
                //     }
                // },
                // {
                //     id: 'two-factor',
                //     title: 'Two-Factor Authentication',
                //     subtitle: 'Add an extra layer of security',
                //     icon: 'shield.lefthalf.filled',
                //     type: 'navigation',
                //     onPress: () => showNotification('2FA setup coming soon', 'info')
                // },
                // {
                //     id: 'device-management',
                //     title: 'Device Management',
                //     subtitle: 'Manage trusted devices',
                //     icon: 'iphone',
                //     type: 'navigation',
                //     onPress: () => showNotification('Device management coming soon', 'info')
                // }
            ]
        },
        // {
        //     title: 'Notifications',
        //     items: [
        //         {
        //             id: 'push-notifications',
        //             title: 'Push Notifications',
        //             subtitle: 'Receive app notifications',
        //             icon: 'bell.fill',
        //             type: 'toggle',
        //             value: notifications,
        //             onToggle: setNotifications
        //         },
        //         {
        //             id: 'transaction-alerts',
        //             title: 'Transaction Alerts',
        //             subtitle: 'Get notified of all transactions',
        //             icon: 'creditcard.fill',
        //             type: 'toggle',
        //             value: transactionAlerts,
        //             onToggle: setTransactionAlerts
        //         },
        //         {
        //             id: 'marketing-emails',
        //             title: 'Marketing Emails',
        //             subtitle: 'Receive promotional offers',
        //             icon: 'envelope.fill',
        //             type: 'toggle',
        //             value: marketingEmails,
        //             onToggle: setMarketingEmails
        //         }
        //     ]
        // },
        // {
        //     title: 'Preferences',
        //     items: [
        //         {
        //             id: 'language',
        //             title: 'Language',
        //             subtitle: 'English (US)',
        //             icon: 'globe',
        //             type: 'navigation',
        //             onPress: () => showNotification('Language selection coming soon', 'info')
        //         },
        //         {
        //             id: 'currency',
        //             title: 'Currency',
        //             subtitle: 'Nigerian Naira (₦)',
        //             icon: 'dollarsign.circle.fill',
        //             type: 'navigation',
        //             onPress: () => showNotification('Currency selection coming soon', 'info')
        //         },
        //         {
        //             id: 'theme',
        //             title: 'Dark Mode',
        //             subtitle: 'Switch between light and dark theme',
        //             icon: 'moon.fill',
        //             type: 'toggle',
        //             value: darkMode,
        //             onToggle: setDarkMode
        //         }
        //     ]
        // },
        {
            title: 'Support',
            items: [
                // {
                //     id: 'help-center',
                //     title: 'Help Center',
                //     subtitle: 'FAQs and support articles',
                //     icon: 'questionmark.circle.fill',
                //     type: 'navigation',
                //     onPress: () => showNotification('Help center coming soon', 'info')
                // },
                {
                    id: 'contact-support',
                    title: 'Contact Support',
                    subtitle: 'Get help from our team',
                    icon: 'message.fill',
                    type: 'navigation',
                    onPress: () => showNotification('Support chat coming soon', 'info')
                },
                {
                    id: 'feedback',
                    title: 'Send Feedback',
                    subtitle: 'Share your thoughts with us',
                    icon: 'star.fill',
                    type: 'navigation',
                    onPress: () => showNotification('Feedback form coming soon', 'info')
                }
            ]
        },
        {
            title: 'Legal',
            items: [
                {
                    id: 'terms',
                    title: 'Terms of Service',
                    icon: 'doc.text.fill',
                    type: 'navigation',
                    onPress: () => showNotification('Terms of service coming soon', 'info')
                },
                {
                    id: 'privacy',
                    title: 'Privacy Policy',
                    icon: 'hand.raised.fill',
                    type: 'navigation',
                    onPress: () => showNotification('Privacy policy coming soon', 'info')
                },
                // {
                //     id: 'licenses',
                //     title: 'Open Source Licenses',
                //     icon: 'text.book.closed.fill',
                //     type: 'navigation',
                //     onPress: () => showNotification('Licenses coming soon', 'info')
                // }
            ]
        },
        {
            title: 'Account Actions',
            items: [
                {
                    id: 'logout',
                    title: 'Logout',
                    icon: 'arrow.right.square.fill',
                    type: 'action',
                    onPress: handleLogout,
                    destructive: false
                },
                // {
                //     id: 'delete-account',
                //     title: 'Delete Account',
                //     subtitle: 'Permanently delete your account',
                //     icon: 'trash.fill',
                //     type: 'action',
                //     onPress: handleDeleteAccount,
                //     destructive: true
                // }
            ]
        }
    ];

    const renderSettingsItem = (item: SettingsItem) => {
        const iconColor = item.destructive ? Palette.error : Palette.primary;
        const titleColor = item.destructive ? Palette.error : textColor;

        return (
            <TouchableOpacity
                key={item.id}
                style={[styles.settingsItem, { backgroundColor: cardBackground, borderBottomColor: borderColor }]}
                onPress={item.onPress}
                activeOpacity={0.7}
                disabled={item.type === 'toggle'}
            >
                <View style={styles.settingsItemLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
                        <IconSymbol name={item.icon} size={20} color={iconColor} />
                    </View>
                    <View style={styles.textContainer}>
                        <View style={styles.titleRow}>
                            <ThemedText style={[styles.settingsTitle, { color: titleColor }]}>
                                {item.title}
                            </ThemedText>
                            {item.showBadge && (
                                <View style={[styles.badge, { backgroundColor: item.badgeColor || Palette.warning }]}>
                                    <ThemedText style={styles.badgeText}>
                                        {item.badgeText}
                                    </ThemedText>
                                </View>
                            )}
                        </View>
                        {item.subtitle && (
                            <ThemedText style={[styles.settingsSubtitle, { color: secondaryTextColor }]}>
                                {item.subtitle}
                            </ThemedText>
                        )}
                    </View>
                </View>
                
                <View style={styles.settingsItemRight}>
                    {item.type === 'toggle' && item.onToggle ? (
                        <Switch
                            value={item.value}
                            onValueChange={item.onToggle}
                            trackColor={{ false: borderColor, true: Palette.primary + '40' }}
                            thumbColor={item.value ? Palette.primary : secondaryTextColor}
                        />
                    ) : (
                        <IconSymbol name="chevron.right" size={16} color={secondaryTextColor} />
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: borderColor }]}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <IconSymbol name="chevron.left" size={24} color={textColor} />
                    </TouchableOpacity>
                    <ThemedText style={[styles.headerTitle, { color: textColor }]}>
                        Settings
                    </ThemedText>
                    <View style={styles.headerSpacer} />
                </View>

                {/* User Profile Section */}
                <View style={[styles.profileSection, { backgroundColor: cardBackground, borderColor }]}>
                    <View style={[styles.avatar, { backgroundColor: Palette.primary + '20' }]}>
                        <ThemedText style={[styles.avatarText, { color: Palette.primary }]}>
                            {userData.fullname?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                        </ThemedText>
                    </View>
                    <View style={styles.profileInfo}>
                        <ThemedText style={[styles.profileName, { color: textColor }]}>
                            {userData.fullname || 'User'}
                        </ThemedText>
                        <ThemedText style={[styles.profileEmail, { color: secondaryTextColor }]}>
                            {userData.email || 'user@example.com'}
                        </ThemedText>
                        <ThemedText style={[styles.profileBalance, { color: Palette.success }]}>
                            Balance: ₦{userData.amount?.toLocaleString() || '0.00'}
                        </ThemedText>
                    </View>
                </View>

                {/* Settings Sections */}
                {settingsSections.map((section, sectionIndex) => (
                    <View key={sectionIndex} style={styles.section}>
                        <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                            {section.title}
                        </ThemedText>
                        <View style={[styles.sectionCard, { backgroundColor: cardBackground, borderColor }]}>
                            {section.items.map((item, itemIndex) => (
                                <View key={item.id}>
                                    {renderSettingsItem(item)}
                                    {itemIndex < section.items.length - 1 && (
                                        <View style={[styles.separator, { backgroundColor: borderColor }]} />
                                    )}
                                </View>
                            ))}
                        </View>
                    </View>
                ))}

                {/* App Version */}
                <View style={styles.versionSection}>
                    <ThemedText style={[styles.versionText, { color: secondaryTextColor }]}>
                        FinSync v1.0.0
                    </ThemedText>
                    <ThemedText style={[styles.buildText, { color: secondaryTextColor }]}>
                        Build 2024.12.1
                    </ThemedText>
                </View>
            </ScrollView>
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
        paddingBottom: 32,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
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
        marginRight: 32,
    },
    headerSpacer: {
        width: 32,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 20,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontSize: 22,
        fontWeight: '600',
        fontFamily: 'Belgrano-Regular',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 18,
        fontWeight: '600',
        fontFamily: 'Belgrano-Regular',
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 14,
        marginBottom: 4,
    },
    profileBalance: {
        fontSize: 14,
        fontWeight: '500',
    },
    section: {
        marginHorizontal: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Belgrano-Regular',
        marginBottom: 12,
        marginLeft: 4,
    },
    sectionCard: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },
    settingsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        minHeight: 64,
    },
    settingsItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    settingsTitle: {
        fontSize: 16,
        fontWeight: '500',
        fontFamily: 'Belgrano-Regular',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginLeft: 8,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: Palette.white,
    },
    settingsSubtitle: {
        fontSize: 14,
        marginTop: 2,
    },
    settingsItemRight: {
        marginLeft: 12,
    },
    separator: {
        height: 1,
        marginLeft: 64,
    },
    versionSection: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    versionText: {
        fontSize: 14,
        fontWeight: '500',
    },
    buildText: {
        fontSize: 12,
        marginTop: 4,
    },
});
