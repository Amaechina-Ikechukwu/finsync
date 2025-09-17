import React, { useMemo, useState } from 'react';
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

interface Contact {
  name: string;
  phone: string;
  originalPhone?: string;
}

interface ContactSelectionModalProps {
  visible: boolean;
  contacts: Contact[];
  onSelectContact: (contact: Contact) => void;
  onClose: () => void;
}

export default function ContactSelectionModal({
  visible,
  contacts,
  onSelectContact,
  onClose
}: ContactSelectionModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');

  const cardBg = isDark ? Palette.lighterBlack : Palette.white;
  const borderColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
  // Filter contacts based on search query
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    
    const query = searchQuery.toLowerCase();
    return contacts.filter(contact => 
      contact.name.toLowerCase().includes(query) ||
      contact.phone.includes(query) ||
      (contact.originalPhone && contact.originalPhone.includes(query))
    );
  }, [contacts, searchQuery]);

  const handleSelectContact = (contact: Contact) => {
    onSelectContact(contact);
    setSearchQuery(''); // Reset search when contact is selected
  };

  const handleClose = () => {
    setSearchQuery(''); // Reset search when modal is closed
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <ThemedView style={styles.modalContainer}>
        <SafeAreaView style={styles.modalSafeArea}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Select Contact
            </ThemedText>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
            >
              <IconSymbol name="xmark" size={24} color={isDark ? Palette.white : Palette.black} />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <View style={[styles.searchInputContainer, { backgroundColor: cardBg, borderColor }]}>
              <IconSymbol name="magnifyingglass" size={20} color={isDark ? Palette.gray : Palette.grayDark} />
              <ThemedTextInput
                style={styles.searchInput}
                placeholder="Search contacts..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={isDark ? Palette.gray : Palette.grayDark}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearButton}
                >
                  <IconSymbol name="xmark.circle.fill" size={20} color={isDark ? Palette.gray : Palette.grayDark} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Contacts List */}
          {filteredContacts.length > 0 ? (
            <FlatList
              data={filteredContacts}
              keyExtractor={(item, index) => `${item.name}-${item.phone}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.contactItem, { backgroundColor: cardBg, borderColor }]}
                  onPress={() => handleSelectContact(item)}
                >                  <View style={styles.contactInfo}>
                    <ThemedText style={styles.contactName}>{item.name}</ThemedText>
                    <ThemedText style={styles.contactPhone}>{item.originalPhone || item.phone}</ThemedText>
                  </View>
                  <IconSymbol name="chevron.right" size={20} color={isDark ? Palette.gray : Palette.grayDark} />
                </TouchableOpacity>
              )}
              style={styles.contactsList}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <IconSymbol name="person.slash" size={48} color={isDark ? Palette.gray : Palette.grayDark} />
              <ThemedText style={styles.emptyText}>
                {searchQuery ? 'No contacts found' : 'No contacts available'}
              </ThemedText>
              {searchQuery && (
                <ThemedText style={styles.emptySubtext}>
                  Try adjusting your search
                </ThemedText>
              )}
            </View>
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
  },
  closeButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  contactsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },  contactInfo: {
    flex: 1,
    marginRight: 8,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    opacity: 0.7,
    flexWrap: 'wrap',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 8,
    textAlign: 'center',
  },
});
