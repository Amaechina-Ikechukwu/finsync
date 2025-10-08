import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import TransactionPinModal from '@/components/TransactionPinModal';
import AppButton from '@/components/ui/AppButton';
import CustomAlert from '@/components/ui/CustomAlert';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { VIRTUAL_NUMBER_COUNTRIES as SUPPORTED_VN_COUNTRIES } from '@/constants/virtualNumberCountries';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { VirtualNumberProductsByService, VirtualNumberPurchaseData, virtualNumberService, type VirtualNumberCountryItem } from '@/services/apiService';
import { useAppStore } from '@/store';
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
  // Countries come from backend: iso (slug to use in pricing), text_en (display name)
  interface UICountry { code: string; name: string; flag?: string }
  const [countries, setCountries] = useState<UICountry[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<UICountry | null>(null);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinProcessing, setPinProcessing] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<VirtualNumberProduct | null>(null);
  const [purchaseResult, setPurchaseResult] = useState<VirtualNumberPurchaseData | null>(null);
  const [processingProductKey, setProcessingProductKey] = useState<string | null>(null); // identify which product is in-flight
  const listRef = React.useRef<FlatList<VirtualNumberProduct> | null>(null);

  // When a purchase completes successfully, bring the user attention to the result section.
  useEffect(() => {
    if (purchaseResult) {
      // Optionally we could navigate to details screen or refresh purchases list.
      // For now: flash scroll to top (where result box sits) to highlight.
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  }, [purchaseResult]);
  const { userData } = useAppStore();

  // Load countries from backend and map to UI type; attempt to reuse known flags where possible
  useEffect(() => {
    const loadCountries = async () => {
      try {
        setLoading(true);
        const res = await virtualNumberService.getCountries();
        if (!res.success || !res.data) throw new Error(res.message || res.error || 'Failed to load countries');
        const items = res.data as VirtualNumberCountryItem[];
        const list: UICountry[] = items.map((it) => {
          // try to find a known flag by matching supported list by normalized name
          const match = SUPPORTED_VN_COUNTRIES.find((c) => c.name.toLowerCase() === it.text_en.toLowerCase());
          return { code: it.iso, name: it.text_en, flag: match?.flag };
        });
        // Prefer Nigeria by default if present, else first item
        const defaultCountry = list.find((c) => /nigeria/i.test(c.name)) || list[0] || null;
        setCountries(list);
        setSelectedCountry(defaultCountry);
        if (defaultCountry) {
          await fetchProducts(defaultCountry.code);
        }
      } catch (e: any) {
        setError(e?.message || 'Unable to load countries');
      } finally {
        setLoading(false);
      }
    };
    loadCountries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch products when country changes via explicit call in selection handler (avoid double calls)

  useEffect(() => {
    filterProducts();
  }, [searchQuery, products]);

  const fetchProducts = async (countryCode?: string) => {
    try {
      setLoading(true);
      setError(null);
      
  const code = countryCode || selectedCountry?.code;
  if (!code) throw new Error('Select a country first');
  const response = await virtualNumberService.getVirtualNumberPricing(code);

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

  // Pricing data transform from { [service]: { [operator]: { cost, count, rate? }}} to flat list

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
    // Guard: require a transaction PIN before allowing purchase
    // (Other areas already enforce this, but VN screen now consistent)
    if (!userData?.hasTransactionPin) {
      showConfirm(
        'Set Transaction PIN',
        'You need to set up a transaction PIN before purchasing a virtual number. Go to Settings > Security to create one.',
        () => {}
      );
      return;
    }
    setPendingProduct(product);
    showConfirm(
      'Buy Virtual Number',
      `Purchase ${product.serviceName} for ₦${product.cost.toFixed(2)}?`,
      () => {
        setShowPinModal(true);
      }
    );
  };

  const processPurchase = async (pin: string) => {
    // Called once user enters a 4-digit PIN in TransactionPinModal.
    // Keeps pendingProduct on failure so user can retry without re-selecting.
    if (!pendingProduct) return;
    setPinProcessing(true);
    const productKey = `${pendingProduct.serviceCode}-${pendingProduct.operatorCode}`;
    setProcessingProductKey(productKey);
    try {
      const countrySlug = selectedCountry?.code;
      if (!countrySlug) throw new Error('Please select a country');
      const payload = {
        country: countrySlug,
        operator: pendingProduct.operatorCode,
        product: pendingProduct.serviceCode,
        transaction_pin: pin,
      };
      const res = await virtualNumberService.buyVirtualNumber(payload);
      // Normalize backend message for easier matching
      const rawMessage = (res.message || (res as any)?.error || '').toString().toLowerCase();
      const isInvalidPin = !res.success && /(invalid|incorrect) (transaction )?pin/.test(rawMessage);
      if (res.success) {
        if (res.data) setPurchaseResult(res.data as VirtualNumberPurchaseData);
        setShowPinModal(false);
        showSuccess('Success', 'Virtual number purchased successfully');
        setPendingProduct(null); // clear only on success so user can retry on failure
      } else {
        if (isInvalidPin) {
          showConfirm('Invalid PIN', 'The transaction PIN you entered is incorrect. Please try again.', () => {
            setShowPinModal(true);
          });
        } else {
          showConfirm('Purchase Failed', res.message || 'Unable to complete purchase', () => {
            // Keep modal open for retry – user can re-enter correct PIN
            setShowPinModal(true);
          });
        }
      }
    } catch (e: any) {
      showConfirm('Error', e?.message || 'An unexpected error occurred', () => {
        // Allow retry
        setShowPinModal(true);
      });
    } finally {
      setPinProcessing(false);
      setProcessingProductKey(null);
    }
  };

  const renderProduct = ({ item }: { item: VirtualNumberProduct }) => {
    const productKey = `${item.serviceCode}-${item.operatorCode}`;
    const isProcessingThis = processingProductKey === productKey;
    return (
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
            {selectedCountry?.flag ? `${selectedCountry.flag} ` : ''}{selectedCountry?.name || 'Select a country'}
          </ThemedText>
        </View>
      </View>
      
      <AppButton
        title={isProcessingThis ? 'Processing...' : item.count > 0 ? 'Buy Now' : 'Out of Stock'}
        onPress={() => handleBuyProduct(item)}
        style={styles.buyButton}
        disabled={item.count === 0 || isProcessingThis || pinProcessing}
      />
    </ThemedView>
  ); };

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
            data={countries}
            keyExtractor={(item) => item.code + '-' + item.name}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.countryItem,
                  { 
                    backgroundColor: selectedCountry?.code === item.code 
                      ? (isDark ? '#333' : '#F0F0F0') 
                      : 'transparent',
                    opacity: 1,
                  }
                ]}
                onPress={() => {
                  setSelectedCountry({ code: item.code, name: item.name, flag: item.flag });
                  fetchProducts(item.code);
                  setShowCountryModal(false);
                }}
                disabled={false}
              >
                <ThemedText style={styles.countryText}>
                  {item.flag ? `${item.flag} ` : ''}{item.name}
                </ThemedText>
                {selectedCountry?.code === item.code && (
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
            {selectedCountry?.flag ? `${selectedCountry.flag} ` : ''}{selectedCountry?.name || 'Select a country'}
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
          ref={listRef}
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => `${item.serviceCode}-${item.operatorCode}`}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

  {renderCountryModal()}
      <TransactionPinModal
        visible={showPinModal}
        onClose={() => { if (!pinProcessing) { setShowPinModal(false); /* keep pendingProduct for potential retry until success */ } }}
        onPinEntered={processPurchase}
        isProcessing={pinProcessing}
        title="Enter Transaction PIN"
        subtitle={pendingProduct ? `Confirm purchase of ${pendingProduct.serviceName}` : 'Enter your 4-digit PIN'}
      />

      {/* Optionally display purchase result summary */}
      {purchaseResult && (
        <View style={{ padding: 16 }}>
          <ThemedText style={{ fontSize: 16, fontWeight: '600' }}>Last Purchase</ThemedText>
          <ThemedText style={{ fontSize: 14, opacity: 0.7, marginTop: 4 }}>Phone: {purchaseResult.phone}</ThemedText>
          <ThemedText style={{ fontSize: 14, opacity: 0.7 }}>Status: {purchaseResult.status}</ThemedText>
          <ThemedText style={{ fontSize: 14, opacity: 0.7 }}>Product: {purchaseResult.product}</ThemedText>
          <ThemedText style={{ fontSize: 14, opacity: 0.7 }}>Operator: {purchaseResult.operator}</ThemedText>
          {purchaseResult.activationId && (
            <ThemedText style={{ fontSize: 12, opacity: 0.5, marginTop: 4 }}>Activation ID: {purchaseResult.activationId}</ThemedText>
          )}
        </View>
      )}
      
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
