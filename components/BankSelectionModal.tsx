import React from 'react';
import {
    FlatList,
    Modal,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedTextInput } from '@/components/ui/ThemedTextInput';
import { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Bank } from '@/services/apiService';
import FSActivityLoader from './ui/FSActivityLoader';

interface BankSelectionModalProps {
    visible: boolean;
    banks: Bank[];
    isLoading: boolean;
    searchQuery: string;
    onClose: () => void;
    onBankSelect: (bank: Bank) => void;
    onSearchChange: (query: string) => void;
}

export default function BankSelectionModal({
    visible,
    banks,
    isLoading,
    searchQuery,
    onClose,
    onBankSelect,
    onSearchChange,
}: BankSelectionModalProps) {
    const colorScheme = useColorScheme();
    
    // Colors based on theme
    const backgroundColor = colorScheme === 'dark' ? Palette.black : Palette.white;
    const cardBackground = colorScheme === 'dark' ? Palette.lighterBlack : '#f8f9fa';
    const borderColor = colorScheme === 'dark' ? Palette.grayDark : '#e5e7eb';
    const textColor = colorScheme === 'dark' ? Palette.white : Palette.text;
    const secondaryTextColor = colorScheme === 'dark' ? Palette.gray : '#6b7280';

    // Filter banks based on search query
    const filteredBanks = banks.filter(bank =>
        bank.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderBankItem = ({ item }: { item: Bank }) => (
        <TouchableOpacity
            style={[styles.bankItem, { backgroundColor: cardBackground, borderColor }]}
            onPress={() => onBankSelect(item)}
            activeOpacity={0.7}
        >
            <View style={styles.bankItemContent}>
                <View style={[styles.bankIcon, { backgroundColor: Palette.primary + '20' }]}>
                    <IconSymbol name="building.2.fill" size={20} color={Palette.primary} />
                </View>
                <View style={styles.bankDetails}>
                    <ThemedText style={[styles.bankName, { color: textColor }]}>
                        {item.name}
                    </ThemedText>
                 
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <ThemedView style={[styles.modalContainer, { backgroundColor }]}>
                <SafeAreaView style={styles.modalSafeArea}>
                    <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
                        <ThemedText style={[styles.modalTitle, { color: textColor }]}>
                            Select Bank
                        </ThemedText>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeButton}
                        >
                            <IconSymbol name="xmark" size={24} color={textColor} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchContainer}>
                        <ThemedTextInput
                            placeholder="Search banks..."
                            value={searchQuery}
                            onChangeText={onSearchChange}
                            style={styles.searchInput}
                        />
                    </View>

                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <FSActivityLoader />
                            <ThemedText style={[styles.loadingText, { color: secondaryTextColor }]}>
                                Loading banks...
                            </ThemedText>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredBanks}
                            renderItem={renderBankItem}
                            keyExtractor={(item) => item.id.toString()}
                            style={styles.bankList}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.bankListContent}
                            keyboardShouldPersistTaps
                        />
                    )}
                </SafeAreaView>
            </ThemedView>
        </Modal>
    );
}

const styles = StyleSheet.create({
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
        fontWeight: '600',
        fontFamily: 'Belgrano-Regular',
    },
    closeButton: {
        padding: 4,
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    searchInput: {
        marginVertical: 0,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
    },
    bankList: {
        flex: 1,
    },
    bankListContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    bankItem: {
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
        padding: 16,
    },
    bankItemContent: {
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
    bankName: {
        fontSize: 16,
        fontWeight: '500',
        fontFamily: 'Belgrano-Regular',
    },
});
