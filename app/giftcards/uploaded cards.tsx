import { useNotification } from '@/components/InAppNotificationProvider';
import AppButton from '@/components/ui/AppButton';
import { useColorScheme } from '@/hooks/useColorScheme';
import { giftcardsService } from '@/services/apiService';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Dimensions,
  ImageBackground,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function UploadedCardsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<any | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [menuDark, setMenuDark] = useState(false);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? '#181A20' : '#fff';
  const cardColor = isDark ? '#23262F' : '#F9FAFB';
  const textColor = isDark ? '#fff' : '#222';
  const borderColor = isDark ? '#353945' : '#ccc';
  const { showNotification } = useNotification();

  useEffect(() => {
    giftcardsService
      .getUserCards()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setCards(res.data);
        } else {
          setCards([]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Uploaded Gift Cards',
      headerShown: true,
    });
  }, [navigation]);

  const showCardMenu = (card: any, event: any) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Update', 'Delete'],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
          title: 'Card Options',
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handleUpdate(card);
          else if (buttonIndex === 2) handleDelete(card);
        }
      );
    } else {
      // Get the touch coordinates from the press event
      const { pageX, pageY } = event.nativeEvent;
      
      // Menu dimensions
      const menuWidth = 140;
      const menuHeight = 100; // Approximate height for 2 items
      
      // Calculate position to keep menu on screen
      let left = pageX - menuWidth + 20; // Offset slightly to the left of touch point
      let top = pageY + 10; // Offset slightly below touch point
      
      // Ensure menu doesn't go off screen
      if (left < 10) left = 10;
      if (left + menuWidth > screenWidth - 10) left = screenWidth - menuWidth - 10;
      if (top + menuHeight > screenHeight - 50) top = pageY - menuHeight - 10;
      if (top < 50) top = 50; // Account for status bar/header
      
      setMenuPosition({ top, left });
      setSelectedCard(card);
      setMenuDark(isDark);
      setMenuVisible(true);
    }
  };

  const handleUpdate = (card: any) => {
    showNotification('Update feature coming soon', 'info');
  };

  const handleDelete = (card: any) => {
    Alert.alert('Delete Card', 'Are you sure you want to delete this card?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          showNotification('Delete API coming soon', 'info');
        },
      },
    ]);
  };

  const getCardGradient = (index: number) => {
    const gradients = [
      ['#667eea', '#764ba2'],
      ['#f093fb', '#f5576c'],
      ['#4facfe', '#00f2fe'],
      ['#43e97b', '#38f9d7'],
      ['#fa709a', '#fee140'],
      ['#a8edea', '#fed6e3'],
      ['#ffecd2', '#fcb69f'],
    ];
    return gradients[index % gradients.length];
  };

  return (
    <ScrollView style={{ backgroundColor: bgColor }} contentContainerStyle={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={textColor} style={{ marginTop: 40 }} />
      ) : cards.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ color: textColor, textAlign: 'center', marginBottom: 18 }}>
            No cards uploaded yet.
          </Text>
          <AppButton
            title="Upload a Card"
            onPress={() => router.push('/giftcards/sellcards')}
            variant={isDark ? 'white' : 'dark'}
            style={{ maxWidth: 220 }}
          />
        </View>
      ) : (
        cards.map((card, index) => {
          const isSold = card.status?.toLowerCase() === 'sold';
          const gradientColors = getCardGradient(index);

          return (
            <View key={card.id} style={[styles.shadowWrapper,{opacity: isSold ? 0.5 : 1,}]}>
              <Pressable
                style={[
                  styles.cardContainer,
                  {
                    backgroundColor: cardColor,
                    borderColor,
                    
                  },
                ]}
                disabled={isSold}
                android_ripple={{ color: isDark ? '#333' : '#f0f0f0' }}
                onPress={() => {
                  if (!isSold) router.push({ pathname: `/giftcards/buy/${card.id}` });
                }}
              >
                <LinearGradient
                  colors={gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardHeader}
                >
                  {card.image ? (
                    <ImageBackground
                      source={{ uri: card.image }}
                      style={styles.logoContainer}
                      imageStyle={[styles.logoImage, isSold && { opacity: 0.7 }]}
                      blurRadius={isSold ? 8 : 0}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.logoPlaceholder}>
                      <MaterialIcons name="card-giftcard" size={32} color="rgba(255,255,255,0.8)" />
                    </View>
                  )}

                  <Pressable
                    style={styles.menuButton}
                    onPress={(event) => showCardMenu(card, event)}
                  >
                    <MaterialIcons name="more-vert" size={22} color="#fff" />
                  </Pressable>
                </LinearGradient>

                <View style={styles.cardContent}>
                  <Text style={[styles.brandName, { color: textColor }]} numberOfLines={1}>
                    {card.name}
                  </Text>
                  <Text style={[styles.productName, { color: textColor }]} numberOfLines={2}>
                    {card.type}
                  </Text>
                  <View style={styles.cardFooter}>
                    <Text style={[styles.amount, { color: textColor }]}>₦{card.value}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: isSold ? '#f3f4f6' : isDark ? '#374151' : '#dcfce7',
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusIndicator,
                          { backgroundColor: isSold ? '#6b7280' : '#16a34a' },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: isSold ? '#6b7280' : '#16a34a' },
                        ]}
                      >
                        {isSold ? 'Sold' : 'Active'}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            </View>
          );
        })
      )}

      {/* Android Floating Menu */}
      {Platform.OS === 'android' && selectedCard && (() => {
        const isSold = selectedCard.status?.toLowerCase() === 'sold';
        return (
          <Modal transparent visible={menuVisible} animationType="fade">
            <TouchableOpacity
              style={styles.modalOverlay}
              onPress={() => setMenuVisible(false)}
              activeOpacity={1}
              disabled={isSold}
            >
              <View
                style={[
                  styles.menuModal,
                  {
                    top: menuPosition.top,
                    left: menuPosition.left,
                    backgroundColor: menuDark ? '#1f2937' : '#fff',
                    shadowColor: '#000',
                    shadowOpacity: 0.25,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 10,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    handleUpdate(selectedCard);
                  }}
                >
                  <MaterialIcons name="edit" size={18} color={menuDark ? '#fff' : '#222'} />
                  <Text style={[styles.menuText, { color: menuDark ? '#fff' : '#222' }]}>Update</Text>
                </TouchableOpacity>
                <View style={[styles.menuDivider, { backgroundColor: menuDark ? '#374151' : '#e5e5e5' }]} />
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    handleDelete(selectedCard);
                  }}
                >
                  <MaterialIcons name="delete" size={18} color="red" />
                  <Text style={[styles.menuText, { color: 'red' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
        );
      })()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  empty: { alignItems: 'center', justifyContent: 'center', flex: 1, height: '100%' },
  shadowWrapper: {
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  cardContainer: { borderRadius: 20, overflow: 'hidden' },
  cardHeader: { height: 120, justifyContent: 'center', alignItems: 'center' },
  logoContainer: { width: '100%', height: '100%' },
  logoImage: { width: '100%', height: '100%', borderTopRightRadius: 20, borderTopLeftRadius: 20 },
  logoPlaceholder: {
    width: 80,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  menuButton: { 
    position: 'absolute', 
    top: 10, 
    right: 10, 
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)'
  },
  cardContent: { padding: 20 },
  brandName: { fontSize: 14, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
  productName: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount: { fontSize: 20, fontWeight: '800' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusIndicator: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  menuModal: {
    position: 'absolute',
    padding: 4,
    borderRadius: 12,
    width: 140,
    backgroundColor: '#fff',
  },
  menuItem: { 
    paddingVertical: 12, 
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  menuText: { fontSize: 16, fontWeight: '500' },
  menuDivider: {
    height: 1,
    marginHorizontal: 8,
  },
});