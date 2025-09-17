    // Custom fuzzy search for categories
    function normalize(str: string) {
        return str.toLowerCase().replace(/[^a-z0-9 ]/gi, '').trim();
    }

    // Optimized Levenshtein: early exit if > 2
    function fastLevenshtein(a: string, b: string, maxDist = 2) {
        const m = a.length, n = b.length;
        if (Math.abs(m - n) > maxDist) return maxDist + 1;
        const dp = Array(n + 1).fill(0).map((_, j) => j);
        for (let i = 1; i <= m; i++) {
            let prev = dp[0], cur;
            dp[0] = i;
            let minRow = dp[0];
            for (let j = 1; j <= n; j++) {
                cur = dp[j];
                if (a[i - 1] === b[j - 1]) {
                    dp[j] = prev;
                } else {
                    dp[j] = 1 + Math.min(dp[j], dp[j - 1], prev);
                }
                prev = cur;
                if (dp[j] < minRow) minRow = dp[j];
            }
            if (minRow > maxDist) return maxDist + 1;
        }
        return dp[n];
    }

    function fuzzyFilterCategories(categories: string[], search: string) {
        if (!search.trim()) return categories;
        const searchTokens = normalize(search).split(' ').filter(Boolean);
        return categories.filter(cat => {
            const catTokens = normalize(cat).split(' ').filter(Boolean);
            // All search tokens must match at least one category token
            const allMatch = searchTokens.every(sToken => {
                return catTokens.some(cToken => {
                    if (cToken.includes(sToken) || sToken.includes(cToken)) return true;
                    if (fastLevenshtein(cToken, sToken) <= 2) return true;
                    return false;
                });
            });
            // Also match if normalized search is substring of normalized category
            if (normalize(cat).includes(normalize(search))) return true;
            return allMatch;
        });
    }
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
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
import FSActivityLoader from '@/components/ui/FSActivityLoader';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';
import { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { sizzleService, SizzleService } from '@/services/apiService';
import { router } from 'expo-router';
import { Modal } from 'react-native';

export default function SizzleServicesScreen() {
    const colorScheme = useColorScheme()??'light';
    const isDark = colorScheme === 'dark';
    const { showNotification } = useNotification();

    const [services, setServices] = useState<SizzleService[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedService, setSelectedService] = useState<SizzleService | null>(null);
    const [socialAccountLink, setSocialAccountLink] = useState('');
    const [email, setEmail] = useState('');
    const [quantity, setQuantity] = useState('100');
    const [isLoading, setIsLoading] = useState(true);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');

    const cardBg = isDark ? Palette.lighterBlack : Palette.white;
    const borderColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
    const textColor = isDark ? Palette.white : Palette.black;
    const secondaryTextColor = isDark ? Palette.gray : '#6b7280';

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            setIsLoading(true);
            const response = await sizzleService.getServices();

            if (response.success && response.data) {
                setServices(response.data);
                const uniqueCategories = Array.from(new Set(response.data.map(service => service.category)));
                setCategories(uniqueCategories);
            } else {
                showNotification('Failed to fetch services', 'error');
            }
        } catch (error) {
            console.error('Error fetching services:', error);
            showNotification('Network error. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredServices = selectedCategory
        ? services.filter(service => service.category === selectedCategory)
        : [];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const handleContinue = () => {
        if (!selectedService || !socialAccountLink || !email || !quantity) return;
        const totalAmount = selectedService.rate * (parseInt(quantity) / 100);
        const orderData = {
            service: selectedService,
            socialAccountLink,
            email,
            quantity: parseInt(quantity),
            totalAmount
        };
        router.push({
            pathname: '/sizzle/confirmation',
            params: {
                orderData: JSON.stringify(orderData)
            }
        });
    };

    // Track expanded state for each service
    const [expandedServiceIds, setExpandedServiceIds] = useState<{ [key: string]: boolean }>({});

    const renderServiceItem = ({ item }: { item: SizzleService }) => {
        const isExpanded = expandedServiceIds[item.service];
        const maxLength = 120;
        const shouldTruncate = item.desc && item.desc.length > maxLength;
        const displayText = shouldTruncate && !isExpanded
            ? item.desc.slice(0, maxLength) + '...'
            : item.desc;

        return (
            <TouchableOpacity
                style={[styles.serviceItem, { borderColor, backgroundColor: cardBg }]}
                onPress={() => setSelectedService(item)}
            >
                <View style={styles.serviceHeader}>
                    <ThemedText style={[styles.serviceName, { color: textColor }]}>{item.name}</ThemedText>
                    <ThemedText style={[styles.serviceRate, { color: Palette.primary }]}>
                        {formatCurrency(item.rate)}
                    </ThemedText>
                </View>
                {/* <ThemedText style={[styles.serviceRange, { color: secondaryTextColor }]}>
                    {Min: {item.min} | Max: {item.max}}
                </ThemedText> */}
                <ThemedText style={[styles.serviceDesc, { color: secondaryTextColor }]}>
                    {displayText}
                </ThemedText>
                {shouldTruncate && (
                    <TouchableOpacity
                        onPress={() => setExpandedServiceIds(prev => ({
                            ...prev,
                            [item.service]: !isExpanded
                        }))}
                    >
                        <ThemedText style={{ color: Palette.primary, marginTop: 4 }}>
                            {isExpanded ? 'Read Less' : 'Read More'}
                        </ThemedText>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    const renderCategoryItem = ({ item }: { item: string }) => (
        <TouchableOpacity
            style={[styles.categoryItem, { borderColor, backgroundColor: cardBg }]}
            onPress={() => {
                setSelectedCategory(item);
                setSelectedService(null);
                setShowCategoryModal(false);
            }}
        >
            <ThemedText style={[styles.categoryText, { color: textColor }]}>{item}</ThemedText>
            <IconSymbol name="chevron.right" size={20} color={secondaryTextColor} />
        </TouchableOpacity>
    );

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <FSActivityLoader />
                <ThemedText style={styles.loadingText}>Loading services...</ThemedText>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: borderColor }]}> 
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="chevron.left" size={24} color={textColor} />
                </TouchableOpacity>
                <ThemedText style={[styles.headerTitle, { color: textColor }]}> 
                    Social Media Growth
                </ThemedText>
                <View style={styles.placeholder} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior="padding"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
            >
                <View style={{ flex: 1 }}>
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Category Selection */}
                    <View style={[styles.card, { backgroundColor: cardBg }]}> 
                        <ThemedText style={[styles.cardTitle, { color: textColor }]}>Select Category</ThemedText>
                        <TouchableOpacity
                            style={[styles.categorySelector, { backgroundColor: cardBg, borderColor }]}
                            onPress={() => setShowCategoryModal(true)}
                        >
                            <ThemedText style={[styles.categorySelectorText, { color: selectedCategory ? textColor : secondaryTextColor }]}> 
                                {selectedCategory || 'Choose a category...'}
                            </ThemedText>
                            <IconSymbol name="chevron.down" size={20} color={secondaryTextColor} />
                        </TouchableOpacity>
                    </View>

                    {/* Only show the selected service if selected, otherwise show the list */}
                    {selectedCategory && filteredServices.length > 0 && !selectedService && (
                        <View style={[styles.card, { backgroundColor: cardBg }]}> 
                            <ThemedText style={[styles.cardTitle, { color: textColor }]}>Available Services</ThemedText>
                            <FlatList
                                data={filteredServices}
                                renderItem={({ item }) => {
                                    const isExpanded = expandedServiceIds[item.service];
                                    const shouldTruncate = item.desc && item.desc.length > 120;
                                    const displayText = shouldTruncate && !isExpanded
                                        ? item.desc.slice(0, 120) + '...'
                                        : item.desc;
                                    return (
                                        <TouchableOpacity
                                            style={[styles.serviceItem, { borderColor, backgroundColor: cardBg }]}
                                            onPress={() => setSelectedService(item)}
                                        >
                                            <View style={styles.serviceHeader}>
                                                <ThemedText style={[styles.serviceName, { color: textColor }]}>{item.name}</ThemedText>
                                                <ThemedText style={[styles.serviceRate, { color: Palette.primary }]}>
                                                    {formatCurrency(item.rate)}
                                                </ThemedText>
                                            </View>
                                            <ThemedText style={[styles.serviceDesc, { color: secondaryTextColor }]}>
                                                {displayText}
                                            </ThemedText>
                                            {shouldTruncate && (
                                                <TouchableOpacity
                                                    onPress={() => setExpandedServiceIds(prev => ({
                                                        ...prev,
                                                        [item.service]: !isExpanded
                                                    }))}
                                                >
                                                    <ThemedText style={{ color: Palette.primary, marginTop: 4 }}>
                                                        {isExpanded ? 'Read Less' : 'Read More'}
                                                    </ThemedText>
                                                </TouchableOpacity>
                                            )}
                                        </TouchableOpacity>
                                    );
                                }}
                                keyExtractor={(item) => item.service}
                                scrollEnabled={false}
                                showsVerticalScrollIndicator={false}
                                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                            />
                        </View>
                    )}

                    {selectedService && (
                        <View style={[styles.card, { backgroundColor: cardBg }]}> 
                            <ThemedText style={[styles.cardTitle, { color: textColor }]}>Selected Service</ThemedText>
                            <TouchableOpacity
                                style={[styles.serviceItem, { borderColor, backgroundColor: Palette.primary + '20' }]}
                                activeOpacity={1}
                            >
                                <View style={styles.serviceHeader}>
                                    <ThemedText style={[styles.serviceName, { color: textColor }]}>{selectedService.name}</ThemedText>
                                    <ThemedText style={[styles.serviceRate, { color: Palette.primary }]}>
                                        {formatCurrency(selectedService.rate)}
                                    </ThemedText>
                                </View>
                                <ThemedText style={[styles.serviceDesc, { color: secondaryTextColor }]}>
                                    {selectedService.desc && selectedService.desc.length > 120 && !(expandedServiceIds[selectedService.service])
                                        ? selectedService.desc.slice(0, 120) + '...'
                                        : selectedService.desc}
                                </ThemedText>
                                {selectedService.desc && selectedService.desc.length > 120 && (
                                    <TouchableOpacity
                                        onPress={() => setExpandedServiceIds(prev => ({
                                            ...prev,
                                            [selectedService.service]: !prev[selectedService.service]
                                        }))}
                                    >
                                        <ThemedText style={{ color: Palette.primary, marginTop: 4 }}>
                                            {expandedServiceIds[selectedService.service] ? 'Read Less' : 'Read More'}
                                        </ThemedText>
                                    </TouchableOpacity>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Show order details below the list if a service is selected */}
                    {selectedService && (
                        <View style={[styles.card, { backgroundColor: cardBg }]}> 
                            <ThemedText style={[styles.cardTitle, { color: textColor }]}>Order Details</ThemedText>
                            {/* Social Account Link/Email Field */}
                            <View style={styles.inputGroup}>
                                <ThemedText style={[styles.inputLabel, { color: textColor }]}> 
                                    Social Account Link/Email *
                                </ThemedText>
                                <ThemedTextInput
                                    style={styles.input}
                                    placeholder="Enter account link or email"
                                    value={socialAccountLink}
                                    onChangeText={setSocialAccountLink}
                                    autoCapitalize="none" 
                                />
                            </View>

                            {/* Email Field */}
                            <View style={styles.inputGroup}>
                                <ThemedText style={[styles.inputLabel, { color: textColor }]}> 
                                    Your Email Address *
                                </ThemedText>
                                <ThemedTextInput
                                    style={styles.input}
                                    placeholder="Enter your email"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            {/* Quantity Field */}
                            <View style={styles.inputGroup}>
                                <ThemedText style={[styles.inputLabel, { color: textColor }]}> 
                                    Quantity ({selectedService.min} - {selectedService.max})
                                </ThemedText>
                                <ThemedTextInput
                                    style={styles.input}
                                    placeholder="Enter quantity"
                                    value={quantity}
                                    onChangeText={setQuantity}
                                    keyboardType="numeric"
                                />
                            </View>

                            {/* Total Amount */}
                            {quantity && selectedService && parseInt(quantity) > 0 && (
                                <View style={[styles.totalCard, { backgroundColor: `${Palette.primary}10`, borderColor: Palette.primary }]}> 
                                    <ThemedText style={[styles.totalLabel, { color: textColor }]}>Total Amount</ThemedText>
                                    <ThemedText style={[styles.totalAmount, { color: Palette.primary }]}> 
                                        {formatCurrency(selectedService.rate * (parseInt(quantity) / 100))}
                                    </ThemedText>
                                </View>
                            )}
                        </View>
                    )}
                </ScrollView>

                {/* Continue Button */}
                {selectedService && socialAccountLink && email && quantity && (
                    <View style={[styles.footer, { backgroundColor: cardBg, borderTopColor: borderColor }]}> 
                        <AppButton
                            title="Continue"
                            onPress={handleContinue}
                            variant="dark"
                            style={styles.continueButton}
                        />
                    </View>
                )}
                </View>
            </KeyboardAvoidingView>

            {/* Category Selection Modal */}
            <Modal
                visible={showCategoryModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowCategoryModal(false)}
            >
                <ThemedView style={styles.modalContainer}>
                    <SafeAreaView style={styles.modalSafeArea}>
                        <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}> 
                            <ThemedText style={[styles.modalTitle, { color: textColor }]}> 
                                Select Category
                            </ThemedText>
                            <TouchableOpacity
                                onPress={() => setShowCategoryModal(false)}
                                style={styles.closeButton}
                            >
                                <IconSymbol name="xmark" size={24} color={textColor} />
                            </TouchableOpacity>
                        </View>
                        {/* Search input for category */}
                        <View style={{ paddingHorizontal: 20, marginVertical: 12 }}>
                            <ThemedTextInput
                                style={[styles.input,{backgroundColor:isDark?Palette.black:Palette.white}]}
                                placeholder="Search category..."
                                value={categorySearch}
                                onChangeText={setCategorySearch}
                                autoCapitalize="none"
                                
                            />
                        </View>
                        <FlatList
                            data={fuzzyFilterCategories(categories, categorySearch)}
                            renderItem={renderCategoryItem}
                            keyExtractor={(item, index) => `${item}-${index}`}
                            style={styles.categoryList}
                            showsVerticalScrollIndicator={false}
                        />
                    </SafeAreaView>
                </ThemedView>
            </Modal>
        </SafeAreaView>
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

    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        fontFamily: 'Belgrano-Regular',
    },
    categorySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    categorySelectorText: {
        fontSize: 16,
        flex: 1,
    },
    serviceItem: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    serviceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
        marginRight: 12,
    },
    serviceRate: {
        fontSize: 16,
        fontWeight: '700',
    },
    serviceDetails: {
        marginBottom: 8,
    },
    serviceRange: {
        fontSize: 14,
    },
    serviceDesc: {
        fontSize: 14,
        lineHeight: 20,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
    },
    input: {
        marginVertical: 0,
    },
    totalCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 8,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: '700',
    },
    footer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
    },
    continueButton: {
        width: '100%',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    modalContainer: {
        flex: 1,
    },
    modalSafeArea: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '400',
    },
    closeButton: {
        padding: 8,
    },
    categoryList: {
        flex: 1,
        paddingHorizontal: 20,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginVertical: 4,
    },
    categoryText: {
        fontSize: 16,
        flex: 1,
        fontWeight: '500',
    },
});
