import { useNotification } from '@/components/InAppNotificationProvider';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import FSActivityLoader from '@/components/ui/FSActivityLoader';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { auth } from '@/firebase';
import apiClient from '@/services/apiClient';
import { giftcardsService } from '@/services/apiService';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const BuyGiftCardScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revealing, setRevealing] = useState(false);
  const [code, setCode] = useState(null);
  const [approving, setApproving] = useState(false);
  const [disputing, setDisputing] = useState(false);
  const handleDispute = async () => {
    try {
      setDisputing(true);
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://your-fallback-api-url.com/api'}/giftcards/card/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const res = await response.json();
      if (res.success) {
        showNotification(res.message || 'Dispute submitted.', 'success');
        fetchCard();
      } else {
        showNotification(res.message || 'Failed to submit dispute', 'error');
      }
    } catch (err) {
      showNotification('Something went wrong during dispute', 'error');
    } finally {
      setDisputing(false);
    }
  };
  const [buying, setBuying] = useState(false);
  const { showNotification } = useNotification();
  const navigation = useNavigation();
  const colorScheme = useColorScheme() ?? 'light';

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Uploaded Gift Cards',
      headerShown: true
    });
  }, [navigation]);

  const fetchCard = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/giftcards/cards/${id}`);
      if (res.success) {
        setCard(res.data);
        if (res.data.revealed) {
          const revealRes = await giftcardsService.revealCode(id);
          if (revealRes.success) {
            setCode(revealRes.code);
          }
        }
      } else {
        showNotification('Failed to load card', 'error');
      }
    } catch (err) {
      showNotification('Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    try {
      setBuying(true);
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://your-fallback-api-url.com/api'}/giftcards/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ cardId: id })
      });
      const res = await response.json();
      if (res.success) {
        showNotification('Card purchased. Code will now be revealed.', 'success');
        await handleReveal(); // auto reveal after buy
      } else {
        showNotification(res.message || 'Failed to buy card', 'error');
      }
    } catch (err) {
      showNotification('Something went wrong during purchase', 'error');
    } finally {
      setBuying(false);
    }
  };

  const handleReveal = async () => {
    try {
      setRevealing(true);
      const res = await giftcardsService.revealCode(id);
      if (res.success) {
        setCode(res.code);
        fetchCard();
      } else {
        showNotification('Could not reveal code', 'error');
      }
    } catch (err) {
      showNotification('Something went wrong', 'error');
    } finally {
      setRevealing(false);
    }
  };

  const handleApprove = async () => {
    try {
      setApproving(true);
      const res = await giftcardsService.completePurchase(id);
      if (res.success) {
        showNotification('Payment approved and escrow released.', 'success');
        fetchCard();
      } else {
        showNotification('Could not approve payment', 'error');
      }
    } catch (err) {
      showNotification('Something went wrong', 'error');
    } finally {
      setApproving(false);
    }
  };

  useEffect(() => {
 
    fetchCard();
  }, [id]);

  if (loading || !card) {
    return (
      <View style={styles.loaderContainer}>
        <FSActivityLoader />
      </View>
    );
  }

  const isDark = colorScheme === 'dark';
  const theme = Colors[colorScheme];

  return (
    <ThemedView>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: 'transparent' }]}>
        <Image source={{ uri: card.image }} style={[styles.image, { height: SCREEN_HEIGHT * 0.3 }]} resizeMode="cover" />

        <View style={[styles.infoBox, { backgroundColor: isDark ? '#1c1c1c' : '#f0f8ff' }]}>
          <Text style={[styles.infoText, { color: isDark ? '#ccc' : '#333' }]}>
            Once you purchase the card, funds are locked in escrow. You must approve the payment to release it to the seller. If you don't approve it within 6 hours, it will be released automatically.
          </Text>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>{card.name}</Text>
        <Text style={[styles.type, { color: theme.text }]}>{card.type}</Text>

        <View style={styles.metaContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Card Value:</Text>
          <Text style={[styles.value, { color: theme.text }]}>₦{card.value}</Text>
        </View>

        <View style={styles.metaContainer}>
          <Text style={[styles.label, { color: theme.text }]}>You Paid:</Text>
          <Text style={[styles.value, { color: theme.text }]}>₦{card.price}</Text>
        </View>

        <View style={styles.metaContainer}>
          <Text style={[styles.label, { color: theme.text }]}>Processing Fee:</Text>
          <Text style={[styles.value, { color: theme.text }]}>
            {typeof card.escrow?.processingFee !== 'undefined'
              ? `₦${card.escrow.processingFee}`
              : 'N/A'}
          </Text>
        </View>

        <View
          style={[
            styles.escrowContainer,
            {
              backgroundColor: isDark ? '#222' : '#f9f9f9',
              borderColor: isDark ? '#444' : '#ddd'
            }
          ]}
        >
          <Text style={{ color: theme.text }}>
            {card.escrow
              ? card.escrow.held
                ? `₦${card.price} held in escrow`
                : `₦${card.price} released from escrow`
              : 'Escrow information unavailable'}
          </Text>
        </View>

        {card.status == 'available'  && (
          <AppButton
            title={buying ? 'Buying…' : 'Buy Card'}
            onPress={handleBuy}
            loading={buying}
            disabled={buying}
            variant="coral"
            style={{ marginTop: 20, width: '100%' }}
          />
        )}

        {card.status === 'sold' && !card.revealed && (
          <AppButton
            title={revealing ? 'Revealing…' : 'Reveal Gift Code'}
            onPress={handleReveal}
            loading={revealing}
            disabled={revealing}
            variant="dark"
            style={{ marginTop: 20, width: '100%' }}
          />
        )}

        {card.revealed && code && (
          <View
            style={[
              styles.codeContainer,
              { backgroundColor: isDark ? '#153515' : '#e6ffe6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.codeLabel, { color: theme.text }]}>Gift Code:</Text>
              <Text selectable style={[styles.code, { color: theme.text }]}>{code}</Text>
            </View>
            <TouchableOpacity
              onPress={async () => {
                await Clipboard.setStringAsync(code);
                showNotification('Gift code copied to clipboard', 'success');
              }}
              style={{ marginLeft: 12, padding: 8, borderRadius: 6, backgroundColor: isDark ? '#222' : '#e0e0e0' }}
              accessibilityLabel="Copy gift code"
            >
              <IconSymbol name="doc.on.doc" size={22} color={isDark ? '#fff' : '#222'} />
            </TouchableOpacity>
          </View>
        )}

        {code && card.escrow?.held && (
          <>
            <AppButton
              title={approving ? 'Approving…' : 'Approve Money to Seller'}
              onPress={handleApprove}
              loading={approving}
              disabled={approving || disputing}
              variant={isDark ? 'white' : 'dark'}
              style={{ marginTop: 16, width: '100%' }}
            />
            <AppButton
              title={disputing ? 'Submitting Dispute…' : 'Dispute Card'}
              onPress={handleDispute}
              loading={disputing}
              disabled={disputing || approving}
              variant="coral"
              style={{ marginTop: 12, width: '100%' }}
            />
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center'
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  image: {
    width: '100%',
    borderRadius: 12,
    marginBottom: 16
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4
  },
  type: {
    fontSize: 16,
    marginBottom: 20
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 6
  },
  label: {
    fontWeight: '600'
  },
  value: {
    fontWeight: 'bold'
  },
  escrowContainer: {
    marginVertical: 14,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    width: '100%'
  },
  codeContainer: {
    marginVertical: 20,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%'
  },
  codeLabel: {
    fontSize: 16,
    fontWeight: '600'
  },
  code: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    letterSpacing: 2
  },
  infoBox: {
    width: '100%',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20
  }
});

export default BuyGiftCardScreen;