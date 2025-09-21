import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View, useColorScheme } from 'react-native';

interface HostedCard {
  id: string;
  code: string;
  createdAt: number;
  image: string;
  name: string;
  price: number;
  sellerId: string;
  status: string;
  type: string;
  value: number;
}

const HostedCardList: React.FC = () => {
  const [cards, setCards] = useState<HostedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme() ?? 'light';

  useEffect(() => {
    const fetchHostedCards = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || '';
        const response = await fetch(`${apiUrl}/giftcards/available`);
        const data = await response.json();
        if (data.success && Array.isArray(data.cards)) {
      
          setCards(data.cards);
        } else {
          setError('Failed to load hosted cards');
        }
      } catch (err) {
        setError('Failed to load hosted cards');
      }
      setLoading(false);
    };
    fetchHostedCards();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#fff' : '#222'} />
        <Text style={[styles.text, { marginTop: 12, color: colorScheme === 'dark' ? '#fff' : '#222' }]}>Loading hosted cards...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.text, { color: '#ef4444' }]}>{error}</Text>
      </View>
    );
  }

  if (!cards.length) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>No hosted cards available.</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: HostedCard }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardType}>{item.type}</Text>
        <Text style={styles.cardValue}>Value: {item.value}</Text>
        <Text style={styles.cardPrice}>Price: {item.price}</Text>
        <Text style={styles.cardStatus}>Status: {item.status}</Text>
      </View>
    </View>
  );

  return (
    <FlatList
      data={cards}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
    />
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: '#888' },
  listContent: { padding: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 16,
    backgroundColor: '#f3f4f6',
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  cardType: { fontSize: 14, color: '#666', marginBottom: 2 },
  cardValue: { fontSize: 14, color: '#444', marginBottom: 2 },
  cardPrice: { fontSize: 14, color: '#222', marginBottom: 2 },
  cardStatus: { fontSize: 13, color: '#888' },
});

export default HostedCardList;
