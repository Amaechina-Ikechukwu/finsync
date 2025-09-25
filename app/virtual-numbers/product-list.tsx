import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AppButton from '@/components/ui/AppButton';
import CustomAlert from '@/components/ui/CustomAlert';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { VIRTUAL_NUMBER_COUNTRIES as COUNTRIES, type Country } from '@/constants/virtualNumberCountries';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { VirtualNumberProductsByService, virtualNumberService } from '@/services/apiService';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface VirtualNumberProduct {
  serviceCode: string;
  serviceName: string;
  operatorCode: string;
  cost: number;
  count: number;
  rate?: number;
}

export default function ProductListScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { alertState, hideAlert, showConfirm, showSuccess } = useCustomAlert();
  
  const [products, setProducts] = useState<VirtualNumberProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<VirtualNumberProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [showCountryModal, setShowCountryModal] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [selectedCountry]);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
  // Backend expects a country slug (e.g., 'nigeria'), not ISO code ('ng')
  const countrySlug = getCountrySlug(selectedCountry);
  const response = await virtualNumberService.getVirtualNumberPricing(countrySlug);
      console.log(JSON.stringify(response,null,2))
      if (response.success && response.data) {
        const payload = (response.data as any)?.data ?? response.data;
        const productList = transformApiData(payload as VirtualNumberProductsByService);
        setProducts(productList);
      } else {
        setError(response.message || response.error || 'Failed to fetch products');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Error fetching products: ${msg}`);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Map common ISO codes to backend slugs; fallback to a safe slugified name
  const getCountrySlug = (country: Country) => {
    const map: Record<string, string> = {
      ng: 'nigeria',
      us: 'united-states',
      gb: 'united-kingdom',
      gh: 'ghana',
      ke: 'kenya',
      ca: 'canada',
      in: 'india',
    };
    return map[country.code] || country.name.trim().toLowerCase().replace(/\s+/g, '-');
  };

  const transformApiData = (data: VirtualNumberProductsByService): VirtualNumberProduct[] => {
    const products: VirtualNumberProduct[] = [];
    
    Object.entries(data).forEach(([serviceCode, operators]) => {
      Object.entries(operators).forEach(([operatorCode, details]) => {
        products.push({
          serviceCode,
          serviceName: serviceCode, // Use actual service code as name
          operatorCode,
          cost: details.cost,
          count: details.count,
          rate: details.rate,
        });
      });
    });
    
    return products.sort((a, b) => a.cost - b.cost);
  };

  const filterProducts = () => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(product =>
      product.serviceCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.operatorCode.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setFilteredProducts(filtered);
  };

  const handleBuyProduct = (product: VirtualNumberProduct) => {
    showConfirm(
      'Buy Virtual Number',
      `Purchase ${product.serviceName} for ₦${product.cost.toFixed(2)}?`,
      () => {
        // Navigate to purchase confirmation or process purchase
        showSuccess('Success', 'Purchase initiated');
      }
    );
  };

  const renderProduct = ({ item }: { item: VirtualNumberProduct }) => (
    <ThemedView style={[styles.productCard, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}>
      <View style={styles.productHeader}>
        <View style={styles.productInfo}>
          <ThemedText style={styles.serviceName}>{item.serviceName}</ThemedText>
          <ThemedText style={styles.serviceCode}>
            {item.serviceCode} • {item.operatorCode}
          </ThemedText>
        </View>
        <View style={styles.priceContainer}>
          <ThemedText style={styles.price}>₦{item.cost.toFixed(2)}</ThemedText>
          {item.rate && (
            <ThemedText style={styles.rate}>Rate: {item.rate}%</ThemedText>
          )}
        </View>
      </View>
      
      <View style={styles.productDetails}>
        <View style={styles.detailRow}>
          <IconSymbol name="receipt" size={16} color={isDark ? '#9BA1A6' : '#687076'} />
          <ThemedText style={styles.detailLabel}>Available:</ThemedText>
          <ThemedText style={styles.detailValue}>
            {item.count > 0 ? `${item.count} numbers` : 'Out of stock'}
          </ThemedText>
        </View>
        
        <View style={styles.detailRow}>
          <IconSymbol name="person" size={16} color={isDark ? '#9BA1A6' : '#687076'} />
          <ThemedText style={styles.detailLabel}>Country:</ThemedText>
          <ThemedText style={styles.detailValue}>
            {selectedCountry.flag} {selectedCountry.name}
          </ThemedText>
        </View>
      </View>
      
      <AppButton
        title={item.count > 0 ? "Buy Now" : "Out of Stock"}
        onPress={() => handleBuyProduct(item)}
        style={styles.buyButton}
        disabled={item.count === 0}
      />
    </ThemedView>
  );

  const renderCountryModal = () => (
    <Modal
      visible={showCountryModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowCountryModal(false)}
    >
      <View style={styles.modalOverlay}>
        <ThemedView style={[styles.modalContent, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Select Country</ThemedText>
            <TouchableOpacity onPress={() => setShowCountryModal(false)}>
              <IconSymbol name="xmark" size={24} color={isDark ? '#FFF' : '#000'} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={COUNTRIES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.countryItem,
                  { backgroundColor: selectedCountry.code === item.code ? (isDark ? '#333' : '#F0F0F0') : 'transparent' }
                ]}
                onPress={() => {
                  setSelectedCountry(item);
                  setShowCountryModal(false);
                }}
              >
                <ThemedText style={styles.countryText}>
                  {item.flag} {item.name}
                </ThemedText>
                {selectedCountry.code === item.code && (
                  <IconSymbol name="add" size={20} color="#4CAF50" />
                )}
              </TouchableOpacity>
            )}
          />
        </ThemedView>
      </View>
    </Modal>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Virtual Numbers</ThemedText>
        <ThemedText style={styles.headerSubtitle}>Choose a service to get started</ThemedText>
      </View>

      {/* Country Selector */}
      <TouchableOpacity
        style={[styles.countrySelector, { backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA' }]}
        onPress={() => setShowCountryModal(true)}
      >
        <View style={styles.countrySelectorContent}>
          <IconSymbol name="person" size={20} color={isDark ? '#9BA1A6' : '#687076'} />
          <ThemedText style={styles.countrySelectorText}>
            {selectedCountry.flag} {selectedCountry.name}
          </ThemedText>
        </View>
        <IconSymbol name="chevron.right" size={16} color={isDark ? '#9BA1A6' : '#687076'} />
      </TouchableOpacity>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: isDark ? '#2A2A2A' : '#F8F9FA' }]}>
        <IconSymbol name="magnifyingglass" size={20} color={isDark ? '#9BA1A6' : '#687076'} />
        <TextInput
          style={[styles.searchInput, { color: isDark ? '#FFF' : '#000' }]}
          placeholder="Search services..."
          placeholderTextColor={isDark ? '#9BA1A6' : '#687076'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <IconSymbol name="xmark.circle.fill" size={20} color={isDark ? '#9BA1A6' : '#687076'} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <ThemedView style={styles.loadingContainer}>
          <ThemedText>Loading products...</ThemedText>
        </ThemedView>
      ) : error ? (
        <ThemedView style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color="#FF6B6B" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <AppButton
            title="Retry"
            onPress={fetchProducts}
            style={styles.retryButton}
          />
        </ThemedView>
      ) : filteredProducts.length === 0 ? (
        <ThemedView style={styles.emptyContainer}>
          <IconSymbol name="magnifyingglass" size={80} color={isDark ? '#4A4A4A' : '#E0E0E0'} />
          <ThemedText style={styles.emptyTitle}>
            {searchQuery ? 'No Results Found' : 'No Products Available'}
          </ThemedText>
          <ThemedText style={styles.emptyDescription}>
            {searchQuery 
              ? `No products match "${searchQuery}". Try a different search term.`
              : 'No virtual number products are available for this country at the moment.'
            }
          </ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => `${item.serviceCode}-${item.operatorCode}`}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {renderCountryModal()}
      
      <CustomAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        onRequestClose={hideAlert}
        icon={alertState.icon}
        iconColor={alertState.iconColor}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginTop: 4,
  },
  countrySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  countrySelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countrySelectorText: {
    fontSize: 16,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    textAlign: 'center',
    marginVertical: 16,
    fontSize: 16,
  },
  retryButton: {
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    marginTop: 24,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 24,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  productCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    // elevation: 2,
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  productInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  serviceCode: {
    fontSize: 14,
    opacity: 0.7,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 2,
  },
  rate: {
    fontSize: 12,
    opacity: 0.7,
  },
  productDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    opacity: 0.7,
    minWidth: 70,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  buyButton: {
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  countryText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
