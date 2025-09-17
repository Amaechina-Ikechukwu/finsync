import { ThemedView } from '@/components/ThemedView';
import FSActivityLoader from '@/components/ui/FSActivityLoader';
import { useAppStore } from '@/store/simpleStore';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { FlatList, ImageBackground, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';

const BoughtHostedCards: React.FC = () => {
  const {
    hostedCards,
    hostedCardsLoading: loading,
    hostedCardsError: error,
    fetchHostedCards
  } = useAppStore();
  
  const colorScheme = useColorScheme() ?? 'light';
  const router = useRouter();

  useEffect(() => {
    fetchHostedCards();
  }, []);

  const handleRetry = () => {
    fetchHostedCards();
  };

  const getCardGradient = (index: number) => {
    const gradients = [
      ['#667eea', '#764ba2'], // Purple-Blue
      ['#f093fb', '#f5576c'], // Pink-Red
      ['#4facfe', '#00f2fe'], // Blue-Cyan
      ['#43e97b', '#38f9d7'], // Green-Turquoise
      ['#fa709a', '#fee140'], // Pink-Yellow
      ['#a8edea', '#fed6e3'], // Light Blue-Pink
      ['#ffecd2', '#fcb69f'], // Peach-Orange
      ['#667eea', '#764ba2'], // Purple-Blue (repeat)
    ];
    return gradients[index % gradients.length];
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const gradientColors = getCardGradient(index) as [string, string];
    
    const isDark = colorScheme === 'dark';
    const cardBg = isDark ? '#1a1a1a' : '#ffffff';
    const textPrimary = isDark ? '#ffffff' : '#1a1a1a';
    const textSecondary = isDark ? '#b3b3b3' : '#666666';
    const shadowColor = isDark ? '#000000' : '#000000';

    return (
      <Pressable
        style={[styles.cardContainer, { backgroundColor: cardBg, shadowColor }]}
        android_ripple={{ color: isDark ? '#333' : '#f0f0f0' }}
        onPress={() => router.push({ pathname: '/giftcards/details', params: { cardId: item.id, type: 'hosted' } })}
      >
        {/* Card Header with Gradient */}
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.cardHeader,{  borderTopRightRadius: 20,borderTopLeftRadius:20}]}
        >
          {item.imageUrl ? (
            <ImageBackground
              source={{ uri: item.imageUrl }}
              style={styles.logoContainer}
              imageStyle={styles.logoImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.logoPlaceholder}>
              <MaterialIcons name="card-giftcard" size={32} color="rgba(255,255,255,0.8)" />
            </View>
          )}
          
          {/* Decorative Pattern */}
          <View style={styles.decorativePattern}>
            <View style={styles.patternDot} />
            <View style={styles.patternDot} />
            <View style={styles.patternDot} />
          </View>
        </LinearGradient>

        {/* Card Content */}
        <View style={styles.cardContent}>
          <View style={styles.cardInfo}>
            <Text style={[styles.brandName, { color: textSecondary }]} numberOfLines={1}>
              {item.type.toUpperCase()}
            </Text>
            <Text style={[styles.productName, { color: textPrimary }]} numberOfLines={2}>
              {item.name}
            </Text>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.amountContainer}>
              <Text style={[styles.amount, { color: textPrimary }]}>
                ₦{item.value.toLocaleString()}
              </Text>
              <Text style={[styles.price, { color: textSecondary }]}>
                Price: ₦{item.price.toLocaleString()}
              </Text>
            </View>
            
            <View style={[
              styles.statusBadge, 
              { backgroundColor: item.status === 'sold' ? '#dcfce7' : (isDark ? '#374151' : '#f3f4f6') }
            ]}>
              <View style={[
                styles.statusIndicator,
                { backgroundColor: item.status === 'sold' ? '#16a34a' : '#6b7280' }
              ]} />
              <Text style={[
                styles.statusText,
                { color: item.status === 'sold' ? '#16a34a' : '#6b7280' }
              ]}>
                {item.status === 'sold' ? 'Sold' : item.status}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <FSActivityLoader />
        <Text style={[styles.loadingText, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
          Loading your hosted cards...
        </Text>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centerContainer}>
        <MaterialIcons name="error-outline" size={48} color="#ef4444" />
        <Text style={[styles.errorText, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
          {error}
        </Text>
        <Pressable
          style={{ marginTop: 16, padding: 12, backgroundColor: '#3b82f6', borderRadius: 8 }}
          onPress={handleRetry}
        >
          <Text style={{ color: 'white', fontWeight: '600' }}>Retry</Text>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={hostedCards}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="card-giftcard" size={64} color="#9ca3af" />
            <Text style={[styles.emptyText, { color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
              No hosted gift cards found
            </Text>
            <Text style={[styles.emptySubtext, { color: colorScheme === 'dark' ? '#6b7280' : '#9ca3af' }]}>
              Your purchased hosted gift cards will appear here
            </Text>
          </View>
        }
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  cardContainer: {
    borderRadius: 20,
    marginBottom: 20,
  },
  cardHeader: {
    height: 120,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: "100%",
    height: "100%",
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
   borderTopRightRadius: 20,borderTopLeftRadius:20
  },
  logoPlaceholder: {
    width: 80,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  decorativePattern: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    gap: 8,
  },
  patternDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  cardContent: {
    padding: 20,
  },
  cardInfo: {
    marginBottom: 16,
  },
  brandName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productName: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountContainer: {
    flex: 1,
  },
  amount: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  price: {
    fontSize: 14,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default BoughtHostedCards;
