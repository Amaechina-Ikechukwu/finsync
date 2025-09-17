import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import FSActivityLoader from '@/components/ui/FSActivityLoader';
import { useColorScheme } from '@/hooks/useColorScheme';
import { CryptoCoin, cryptoService } from '@/services/apiService';
import { useAppStore } from '@/store';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CryptoPage = () => {
  const [coins, setCoins] = useState<CryptoCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const setCoinsStore = useAppStore(state => state.setCoins);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await cryptoService.getBuyCoins();
        if (!mounted) return;
        let resCoins: any[] | undefined;
        if (res && (res as any).coins) {
          resCoins = (res as any).coins;
        } else if ((res as any).data && (res as any).data.coins) {
          resCoins = (res as any).data.coins;
        }

        if (resCoins) {
          setCoins(resCoins);
          try { setCoinsStore(resCoins); } catch (e) { /* ignore if store missing */ }
        } else {
          setError('No coins returned from API');
        }
        
      } catch (e: any) {
        setError(e?.message || 'Failed to load coins');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const renderItem = ({ item }: { item: CryptoCoin }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.item}
      onPress={() => router.push({ pathname: '/crypto/buy/[coin]', params: { coin: String(item.id) } })}
    >
      <ThemedText style={styles.icon}>{item.icon ?? ''}</ThemedText>
      <View style={styles.info}>
        <ThemedText style={styles.name}>{item.name} ({item.symbol})</ThemedText>
        <ThemedText style={styles.meta}>{item.network} • ₦{Number(item.current_price_naira).toLocaleString()}</ThemedText>
      </View>
    </TouchableOpacity>
  );

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // useFocusEffect(
  //   useCallback(() => {
  //     // when focused, set status bar to the crypto gradient color
  //     try { StatusBar.setBackgroundColor('#7F00FF', true); } catch (e) {}
  //     StatusBar.setBarStyle('light-content', true);
  //     // restore on blur
  //     return () => {
  //       try { StatusBar.setBackgroundColor('transparent', true); } catch (e) {}
  //       StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content', true);
  //     };
  //   }, [isDark])
  // );

  return (
    <SafeAreaView style={styles.container} edges={{bottom:'off',top:"maximum"}}>
       <ThemedView style={styles.container}>
      {/* <LinearGradient
        colors={["#7F00FF", "#3F2B96"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cryptoBanner}
      > */}
        <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>Available Coins</ThemedText>

        {loading ? (
          <View style={styles.loaderContainer}>
            <FSActivityLoader />
          </View>
        ) : error ? (
          <ThemedText style={styles.error}>{error}</ThemedText>
        ) : (
          <FlatList
            data={coins}
            keyExtractor={(i) => String((i as any).id)}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
        </View>
      {/* </LinearGradient> */}
    </ThemedView>
    </SafeAreaView>
   
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: '600', marginBottom: 12 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  icon: { fontSize: 28, width: 40, textAlign: 'center', },
  info: { marginLeft: 8 },
  name: { fontSize: 16, fontWeight: '500' },
  meta: { fontSize: 13, marginTop: 2 },
  separator: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  loaderContainer: { justifyContent: 'center', alignItems: 'center', paddingVertical: 20 },
  error: { color: '#ffdddd' },
  cryptoBanner: { flex: 1 },
});

export default CryptoPage;