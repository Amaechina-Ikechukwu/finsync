import { useNotification } from "@/components/InAppNotificationProvider";
import SimpleTabs from '@/components/ui/SimpleTabs';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from "@react-native-picker/picker";
import { router, useNavigation } from "expo-router";
import React, { useEffect, useState } from 'react';
import { FlatList, Image, ImageBackground, Platform, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { ProductCategory, ReloadlyProduct, reloadlyService } from '../../services/apiService';
import HostedCardList from './HostedCardList';

// Add proper component declaration
export default function GiftCardsScreen() {
  const tabLabels = ['Marketplace', 'Hosted Cards'];
  const [activeTab, setActiveTab] = useState(0);
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const { showNotification } = useNotification();
  const [country, setCountry] = useState<string>('');
  const [countries, setCountries] = useState<any[]>([]); // [{ name, isoName, flagUrl, ... }]
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [category, setCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);
const navigation=useNavigation()
  // Product state
  const [products, setProducts] = useState<ReloadlyProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 21;

  // Fetch countries from API (using reloadlyService)
  useEffect(() => {
    setLoadingCountries(true);
    reloadlyService.getCountries()
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          setCountries(res.data);
          setCountry(res.data[0]?.name || '');
        } else {
          setCountries([]);
        }
      })
      .catch(() => setCountries([]))
      .finally(() => setLoadingCountries(false));
  }, []);

  // Fetch categories from API
  useEffect(() => {
    setLoadingCategories(true);
    reloadlyService.getProductCategories()
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          setCategories([{ id: 0, name: 'All' }, ...res.data]);
        } else {
          setCategories([{ id: 0, name: 'All' }]);
        }
      })
      .catch(() => setCategories([{ id: 0, name: 'All' }]))
      .finally(() => setLoadingCategories(false));
  }, []);

  // Track last-used filters for pagination
  const lastSearchRef = React.useRef('');
  const lastCountryRef = React.useRef('');
  const lastCategoryRef = React.useRef('All');

  // Fetch products from API (no search param, always fetch all for current filters)
  const fetchProducts = async (reset = false, nextPage = 0, _customSearch?: string, customCountry?: string, customCategory?: string) => {
    if (loadingProducts) return;
    setLoadingProducts(true);
    // Always use the latest filters for pagination
    const useCountry = typeof customCountry === 'string' ? customCountry : country;
    const useCategory = typeof customCategory === 'string' ? customCategory : category;

    // Save last filters for pagination
    if (reset) {
      lastSearchRef.current = typeof _customSearch === 'string' ? _customSearch : '';
      lastCountryRef.current = useCountry;
      lastCategoryRef.current = useCategory;
    }

    const params: any = {
      limit: PAGE_SIZE,
      offset: nextPage * PAGE_SIZE,
    };
    // attach search when provided
    if (typeof _customSearch === 'string' && _customSearch.trim().length > 0) {
      params.search = _customSearch.trim();
    }
    if (useCountry && useCountry !== 'All') params.country = useCountry;
    if (useCategory && useCategory !== 'All') {
      const catObj = categories.find(c => c.name === useCategory);
      if (catObj && catObj.id) params.categoryId = catObj.id;
    }
    // Do NOT add search param here

    try {
      const res = await reloadlyService.getProducts(params);
      const data = Array.isArray(res.data) ? res.data : [];
      if (reset) {
        setProducts(data);
        setPage(0);
      } else {
        setProducts(prev => [...prev, ...data]);
      }
      setHasMore(data.length === PAGE_SIZE);
    } catch (error) {
      if (reset) setProducts([]);
      setHasMore(false);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Initial and filter fetch (no search param)
  useEffect(() => {
    if (countries.length > 0 && categories.length > 0) {
      fetchProducts(true, 0, '', country, category);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, category, countries.length, categories.length]);

  // Search is now client-side only, so no API call on search change
  // Trigger API search when the user submits (presses enter) or clears the input
  const onSubmitSearch = () => {
    const q = search.trim();
    // Reset to first page with search param
    fetchProducts(true, 0, q, country, category);
  };

  // Pagination fetch
  const handleEndReached = () => {
    if (!loadingProducts && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      // Always use last filters for pagination
      fetchProducts(false, nextPage, '', lastCountryRef.current, lastCategoryRef.current);
    }
  };

  // Native header (uses navigation)
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Gift Cards',
      headerShown: true,
    });
  }, [navigation]);

  const renderDropdowns = () => (
    <View>
      <TextInput
        style={[
          styles.searchInput,
          { 
            color: themeColors.text, 
            backgroundColor: colorScheme === 'dark' ? '#232526' : '#f3f4f6', 
            borderColor: colorScheme === 'dark' ? '#444' : '#ccc' 
          }
        ]}
        placeholder="Search gift cards..."
        placeholderTextColor={colorScheme === 'dark' ? '#888' : '#aaa'}
        value={search}
        onChangeText={(val) => { setSearch(val); if (val === '') { onSubmitSearch(); } }}
        onSubmitEditing={onSubmitSearch}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />
      <View style={styles.dropdownRow}>
        <View style={[
          styles.dropdownContainer, 
          { 
            backgroundColor: colorScheme === 'dark' ? '#232526' : '#f3f4f6', 
            borderColor: colorScheme === 'dark' ? '#444' : '#ccc', 
            borderWidth: 1 
          }
        ]}>
          <Text style={[styles.pickerLabel, { color: themeColors.text }]}>Country</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={country}
              onValueChange={value => { setCountry(value); setPage(0); }}
              style={[styles.picker, ]}
              mode="dropdown"
              enabled={!loadingCountries}
              dropdownIconColor={themeColors.text}
            >
              {countries.map(c => (
                <Picker.Item
                  key={c.isoName}
                  label={c.name}
                  value={c.name}
                  // color={themeColors.text}
                />
              ))}
            </Picker>
            {/* Show flag for selected country */}
            {(() => {
              const selected = countries.find(cn => cn.name === country);
              if (selected && selected.flagUrl) {
                return (
                  <Image 
                    source={{ uri: selected.flagUrl }} 
                    style={styles.flagImage}
                  />
                );
              }
              return null;
            })()}
            <MaterialIcons 
              name="arrow-drop-down" 
              size={24} 
              color={themeColors.text} 
              style={styles.pickerIcon} 
              pointerEvents="none" 
            />
          </View>
        </View>
        <View style={[
          styles.dropdownContainer, 
          { 
            backgroundColor: colorScheme === 'dark' ? '#232526' : '#f3f4f6', 
            borderColor: colorScheme === 'dark' ? '#444' : '#ccc', 
            borderWidth: 1 
          }
        ]}>
          <Text style={[styles.pickerLabel, { color: themeColors.text }]}>Category</Text>
          <View style={styles.pickerWrapper}>
            <Picker 
              selectedValue={category}
              onValueChange={value => { setCategory(value); setPage(0); }}
              style={[styles.picker, { color: themeColors.text }]}
              mode="dropdown"
              enabled={!loadingCategories}
              dropdownIconColor={themeColors.text}
            >
              {categories.map(c => (
                <Picker.Item key={c.id} label={c.name} value={c.name} color={themeColors.text} />
              ))}
            </Picker>
            <MaterialIcons 
              name="arrow-drop-down" 
              size={24} 
              color={themeColors.text} 
              style={styles.pickerIcon} 
              pointerEvents="none" 
            />
          </View>
        </View>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: ReloadlyProduct }) => {
    const bgImage = item.logoUrls && item.logoUrls.length > 0 ? item.logoUrls[0] : null;
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.cardItem}
        onPress={() => router.push(`/giftcards/${item.productId}`)}
      >
        {bgImage ? (
          <ImageBackground
            source={{ uri: bgImage }}
            style={styles.cardBgImage}
            blurRadius={2}
            imageStyle={{ borderRadius: 12, opacity: 0.25 }}
            resizeMode="cover"
          >
            <View style={styles.cardOverlay} />
            <View style={styles.cardContentOverlay}>
              <Text style={[styles.cardText, { color: '#222', fontWeight: '700' }]} numberOfLines={2}>
                {item.productName}
              </Text>
              {item.brand?.brandName && (
                <Text style={[styles.cardBrand, { color: '#444' }]} numberOfLines={1}>
                  {item.brand.brandName}
                </Text>
              )}
              {item.category?.name && (
                <Text style={[styles.cardCategory, { color: '#666' }]} numberOfLines={1}>
                  {item.category.name}
                </Text>
              )}
            </View>
          </ImageBackground>
        ) : (
          <View style={[styles.cardBgImage, { backgroundColor: colorScheme === 'dark' ? '#232526' : '#f3f4f6', borderRadius: 12 }]}> 
            <View style={styles.cardContentOverlay}>
              <Text style={[styles.cardText, { color: themeColors.text }]} numberOfLines={2}>
                {item.productName}
              </Text>
              {item.brand?.brandName && (
                <Text style={[styles.cardBrand, { color: colorScheme === 'dark' ? '#aaa' : '#888' }]} numberOfLines={1}>
                  {item.brand.brandName}
                </Text>
              )}
              {item.category?.name && (
                <Text style={[styles.cardCategory, { color: colorScheme === 'dark' ? '#aaa' : '#888' }]} numberOfLines={1}>
                  {item.category.name}
                </Text>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyComponent = () => {
    if (loadingProducts) {
      return <Text style={[styles.loadingText, { color: themeColors.text }]}>Loading...</Text>;
    }
    return <Text style={[styles.loadingText, { color: themeColors.text }]}>No products found.</Text>;
  };

  const renderFooterComponent = () => {
    if (loadingProducts && hasMore && products.length > 0) {
      return <Text style={[styles.loadingText, { color: themeColors.text }]}>Loading more...</Text>;
    }
    return null;
  };

  // Filter products client-side if search is not empty
  const filteredProducts = search.trim().length > 0
    ? products.filter(p =>
        p.productName.toLowerCase().includes(search.trim().toLowerCase()) ||
        (p.brand?.brandName && p.brand.brandName.toLowerCase().includes(search.trim().toLowerCase())) ||
        (p.category?.name && p.category.name.toLowerCase().includes(search.trim().toLowerCase()))
      )
    : products;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}> 
      <SimpleTabs tabs={tabLabels} activeIndex={activeTab} onTabPress={setActiveTab} />
      {activeTab === 0 && (
        <>
          {renderDropdowns()}
          <FlatList
            data={filteredProducts}
            renderItem={renderItem}
            keyExtractor={item => item.productId.toString()}
            numColumns={3}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.flatListContent}
            showsVerticalScrollIndicator={false}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooterComponent}
            ListEmptyComponent={renderEmptyComponent}
          />
        </>
      )}
      {/* {activeTab === 1 && <CardListScreen />}
      {activeTab === 2 && <UploadedCardsScreen />} */}
      {activeTab === 1 && <HostedCardList />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'android' ? 8 : 0,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 12,
    marginTop: 8,
    gap: 8,
  },
  dropdownContainer: {
    flex: 1,
    minWidth: 100,
    maxWidth: 140,
    borderRadius: 8,
    marginRight: 4,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 0, // Remove border
    shadowColor: 'transparent', // Remove shadow
    shadowOpacity: 0,
    elevation: 0,
  },
  pickerWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  pickerIcon: {
    position: 'absolute',
    right: 8,
    top: '50%',
    marginTop: -12,
    zIndex: 1,
    pointerEvents: 'none',
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    marginTop: 4,
    marginBottom: 0,
  },
  picker: {
    height: 36,
    width: '100%',
  },
  searchInput: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 18,
    marginBottom: 12,
  },
  flagImage: {
    width: 24,
    height: 16,
    position: 'absolute',
    left: 8,
    top: 8,
    borderRadius: 2,
  },
  flatListContent: {
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardItem: {
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 0,
    borderRadius: 12,
    minHeight: 120,
    overflow: 'hidden',
    // Remove border and shadow for flat look
    borderWidth: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  cardBgImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 12,
  },
  cardContentOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 6,
  },
  cardText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
    color: '#222',
  },
  cardBrand: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 2,
    color: '#444',
  },
  cardCategory: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
  },
  loadingText: {
    textAlign: 'center',
    margin: 16,
  },
});