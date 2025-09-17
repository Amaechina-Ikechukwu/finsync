import { useNotification } from "@/components/InAppNotificationProvider";
import TransactionPinModal from "@/components/TransactionPinModal";
import TransactionPinSetupModal from "@/components/TransactionPinSetupModal";
import FSActivityLoader from "@/components/ui/FSActivityLoader";
import { useAppStore } from "@/store";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from "react-native";
import AppButton from "../../components/ui/AppButton";
import { Colors, Palette } from "../../constants/Colors";
import apiClient from "../../services/apiClient";

const { height } = Dimensions.get('window');

export default function GiftCardDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const colorScheme = useColorScheme() ?? "light";
  const themeColors = Colors[colorScheme];
  const { showNotification } = useNotification();
  const id = (route.params && typeof route.params === 'object' && 'id' in route.params) ? (route.params as any).id as string : undefined;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);
  // Denomination selection state
  const [selectedDenomination, setSelectedDenomination] = useState<number | null>(null);
  const [buying, setBuying] = useState(false);
  const { userData, setUserData } = useAppStore();
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  useEffect(() => {
    if (!id) {
      setError("No product ID provided.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    apiClient.get(`/reloadly/giftcard/${id}`)
      .then((res) => {
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError(res.error || res.message || "Gift card not found.");
        }
      })
      .catch(() => setError("Failed to fetch gift card details."))
      .finally(() => setLoading(false));
  }, [id]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: data?.productName || "Gift Card Details",
      headerShown: true,
    });
  }, [navigation, data?.productName]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: themeColors.background }]}> 
        <FSActivityLoader />
        <Text style={{ color: themeColors.text, marginTop: 12 }}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: themeColors.background }]}> 
        <MaterialIcons name="error-outline" size={48} color={Palette.error || '#e74c3c'} />
        <Text style={{ color: themeColors.text, marginTop: 12 }}>{error}</Text>
      </View>
    );
  }

  if (!data) return null;

  // Render denomination options
  const renderDenominationOptions = () => {
    if (data.denominationType === "FIXED" && Array.isArray(data.fixedRecipientDenominations)) {
      return (
        <View style={{gap:10}}>
          <Text style={{ color: colorScheme === 'dark' ? '#aaa' : '#555', fontSize: 14, marginBottom: 6 }}>
            Please select a denomination:
          </Text>
          <View style={styles.denominationOptionsRow}>
            {data.fixedRecipientDenominations.map((d: number) => {
              const isSelected = selectedDenomination === d;
              const optionBg = isSelected
                ? (colorScheme === 'dark' ? Palette.primary + '33' : Palette.primary + '22')
                : (colorScheme === 'dark' ? '#232526' : '#f3f4f6');
              const optionBorder = isSelected
                ? Palette.primary
                : (colorScheme === 'dark' ? '#444' : '#e5e7eb');
              return (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.denominationOption,
                    { backgroundColor: optionBg, borderColor: optionBorder },
                  ]}
                  onPress={() => setSelectedDenomination(d)}
                >
                  <Text style={{ color: themeColors.text, fontWeight: '600' }}>
                    {`${data.recipientCurrencyCode} ${d}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
    }
    if (data.denominationType === "RANGE") {
      return (
        <Text style={[styles.sectionValue, { color: themeColors.text }]}>
          {`${data.recipientCurrencyCode} ${data.minRecipientDenomination} - ${data.maxRecipientDenomination}`}
        </Text>
      );
    }
    return <Text style={[styles.sectionValue, { color: themeColors.text }]}>-</Text>;
  };

  // Buy gift card handler: show pin modal first
  const handleBuyGiftCard = () => {
    if (!id || !selectedDenomination) return;
    if (!userData?.hasTransactionPin) {
      setShowPinSetup(true);
      return;
    }
    setShowPinModal(true);
  };

  // Called after pin is entered and validated
  const processOrder = async (pin: string) => {
    setIsProcessing(true);
    try {
      // Optionally, validate pin with backend here before purchase
      // For now, assume pin is valid and proceed
      setShowPinModal(false);
      setBuying(true);
      const res = await apiClient.post(`/reloadly/order/${id}`, {
        quantity: 1,
        unitPrice: selectedDenomination,
        pin,
      });
      if (res.success) {
        showNotification('Gift card purchase successful!', 'success');
        const tx = res.data;
        router.push({
          pathname: '/giftcards/success',
          params: {
            amount: tx.amount,
            currency: tx.currencyCode,
            productName: tx.product?.productName,
            orderId: tx.customIdentifier || tx.id || '-',
            transactionId: tx.transactionId,
           
          },
        });
        // Optionally: navigate, refresh, or show details
      } else {
        showNotification(res.message || 'Purchase failed', 'error');
      }
    } catch (e) {
      showNotification('Purchase failed', 'error');
    } finally {
      setBuying(false);
      setIsProcessing(false);
    }
  };

  return (
    <>
      <ScrollView 
        style={[styles.container, { backgroundColor: themeColors.background }]}
        contentContainerStyle={{ paddingBottom: 32,gap:20 }}
      >
        {data.logoUrls?.[0] && (
          <Image 
            source={{ uri: data.logoUrls[0] }} 
            style={styles.logoLarge} 
            resizeMode="cover" 
          />
        )}
        
        <View style={styles.headerSection}>
          <Text style={[styles.productName, { color: themeColors.text }]}>
            {data.productName}
          </Text>
          {data.brand?.brandName && (
            <Text style={[styles.brand, { color: colorScheme === 'dark' ? '#aaa' : '#888' }]}>
              {data.brand.brandName}
            </Text>
          )}
          <View style={styles.chipRow}>
            {data.category?.name && (
              <View style={[styles.chip, { backgroundColor: colorScheme === 'dark' ? '#232526' : '#f3f4f6' }]}> 
                <MaterialIcons name="category" size={16} color={themeColors.text} />
                <Text style={[styles.chipText, { color: themeColors.text }]}>
                  {data.category.name}
                </Text>
              </View>
            )}
            {data.status && (
              <View style={[styles.chip, { backgroundColor: data.status === 'ACTIVE' ? '#d1fae5' : '#fee2e2' }]}> 
                <MaterialIcons 
                  name={data.status === 'ACTIVE' ? 'check-circle' : 'cancel'} 
                  size={16} 
                  color={data.status === 'ACTIVE' ? '#059669' : '#dc2626'} 
                />
                <Text style={[styles.chipText, { color: data.status === 'ACTIVE' ? '#059669' : '#dc2626' }]}>
                  {data.status}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text,marginBottom:10 }]}>Denominations</Text>
          {renderDenominationOptions()}
          <Text style={{ color: colorScheme === 'dark' ? '#aaa' : '#555', fontSize: 13, marginTop: 6 }}>
            The currency shown is for the gift card. The equivalent amount will be automatically deducted from your account in your local currency.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Redeem Instruction</Text>
          <Text style={[styles.sectionValue, { color: themeColors.text,fontWeight:"400" }]}>
            {data.redeemInstruction?.verbose || '-'}
          </Text>
        </View>

        {/* Buy button using AppButton */}
        <AppButton
          title={buying ? 'Processing...' : 'Buy Gift Card'}
          onPress={handleBuyGiftCard}
          variant={colorScheme === "light" ? "dark" : "white"}
          disabled={buying || data.status !== 'ACTIVE' || (data.denominationType === 'FIXED' && !selectedDenomination)}
          loading={buying}
          style={{ marginTop: 18, borderRadius: 10 }}
          textStyle={{ fontSize: 17, fontWeight: '700', letterSpacing: 0.5 }}
        />
      </ScrollView>
      
      <TransactionPinSetupModal
        visible={showPinSetup}
        onSuccess={() => {
          setShowPinSetup(false);
          setUserData({ ...userData, hasTransactionPin: true });
          showNotification('Transaction PIN set! Please try your purchase again.', 'success');
        }}
        onClose={() => setShowPinSetup(false)}
      />
      {/* Transaction Pin Modal for confirming purchase */}
      <TransactionPinModal
        visible={showPinModal}
        onClose={() => setShowPinModal(false)}
        onPinEntered={processOrder}
        isProcessing={isProcessing}
        title="Confirm Purchase"
        subtitle="Enter your transaction PIN to complete this order"
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 18,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: '#f3f4f6',
  },
  logoLarge: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: '#f3f4f6',
  },
  productName: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  brand: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  flag: {
    width: 18,
    height: 12,
    borderRadius: 2,
    marginRight: 4,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  sectionValue: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 8,
  },
  sectionCol: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 2,
  },
  denominationOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  denominationOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  buyButton: {
    marginTop: 18,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  buyButtonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});