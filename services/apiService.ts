// Gift Card Upload & User Cards
export interface GiftCardUploadResponse {
  success: boolean;
  id: string;
}

export interface UploadedGiftCard {
  id: string;
  buyerId: string;
  code: string;
  createdAt: number;
  escrow: {
    amount: number;
    createdAt: number;
    held: boolean;
    processingFee: number;
    releasedAt: number;
  };
  image: string;
  name: string;
  price: number;
  revealed: boolean;
  sellerId: string;
  status: string;
  type: string;
  value: number;
}

export interface UserGiftCardsResponse {
  success: boolean;
  data: UploadedGiftCard[];
}

export const giftcardsService = {
  upload: (formData: FormData) => apiClient.postForm<{ id: string }>('/giftcards/upload', formData),

  getUserCards: async (): Promise<ApiResponse<UserGiftCardsResponse>> => {
    return await apiClient.get<UserGiftCardsResponse>('/giftcards/user/me');
  },

  /**
   * Buy a gift card by cardId. Returns API response with escrow info.
   */
  buy: async (cardId: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    return apiClient.post<{ success: boolean; message: string }>('/giftcards/buy', { cardId: cardId });
  },

  /**
   * Reveal the code for a purchased card. Returns { success, code }
   */
  revealCode: async (cardId: string): Promise<ApiResponse<{ success: boolean; code: string }>> => {
    return apiClient.post<{ success: boolean; code: string }>(`/giftcards/card/${cardId}/reveal`, {});
  },

  /**
   * Mark a purchase as complete (approve funds release). Returns API response.
   */
  completePurchase: async (cardId: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    return apiClient.post<{ success: boolean; message: string }>(`/giftcards/card/${cardId}/complete`, {});
  },

  /**
   * Delete a user card by cardId.
   */
  deleteUserCard: async (cardId: string): Promise<ApiResponse<any>> => {
    return apiClient.delete(`/giftcards/card/${cardId}`);
  },
};
// Reloadly Transaction Report
export interface ReloadlyTransactionReport {
  transactionId: number;
  amount: number;
  discount: number;
  currencyCode: string;
  fee: number;
  smsFee: number;
  totalFee: number;
  preOrdered: boolean;
  recipientEmail: string;
  recipientPhone: string;
  customIdentifier: string;
  status: string;
  transactionCreatedTime: string;
  product: {
    productId: number;
    productName: string;
    countryCode: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    currencyCode: string;
    brand: {
      brandId: number;
      brandName: string;
    };
  };
  balanceInfo: {
    oldBalance: number;
    newBalance: number;
    cost: number;
    currencyCode: string;
    currencyName: string;
    updatedAt: string;
  };
}

export interface ReloadlyTransactionReportResponse {
  success: boolean;
  data: ReloadlyTransactionReport;
}

export interface ReloadlyOrderCard {
  cardNumber: string;
  pinCode: string;
}

export interface ReloadlyOrderCardsResponse {
  success: boolean;
  data: ReloadlyOrderCard[];
}

export const giftcardService = {
  getTransactionReport: async (id: string | number): Promise<ApiResponse<ReloadlyTransactionReport>> => {
    return await apiClient.get<ReloadlyTransactionReport>(`/reloadly/transaction-report/${id}`);
  },
  getOrderCards: async (id: string | number): Promise<ApiResponse<ReloadlyOrderCard[]>> => {
    return await apiClient.get<ReloadlyOrderCard[]>(`/reloadly/order-cards/${id}`);
  },
};
// Reloadly Product interfaces
export interface ReloadlyProduct {
  productId: number;
  productName: string;
  global: boolean;
  status: string;
  supportsPreOrder: boolean;
  senderFee: number;
  senderFeePercentage: number;
  discountPercentage: number;
  denominationType: string;
  recipientCurrencyCode: string;
  minRecipientDenomination: number | null;
  maxRecipientDenomination: number | null;
  senderCurrencyCode: string;
  minSenderDenomination: number | null;
  maxSenderDenomination: number | null;
  fixedRecipientDenominations: number[];
  fixedSenderDenominations: number[];
  fixedRecipientToSenderDenominationsMap: Record<string, number>;
  metadata: Record<string, any>;
  logoUrls: string[];
  brand: {
    brandId: number;
    brandName: string;
  };
  category: {
    id: number;
    name: string;
  };
  country: {
    isoName: string;
    name: string;
    flagUrl: string;
  };
  redeemInstruction: {
    concise: string;
    verbose: string;
  };
  additionalRequirements: {
    userIdRequired: boolean;
  };
}

export interface ReloadlyProductsResponse {
  success: boolean;
  data: ReloadlyProduct[];
  total?: number;
  limit?: number;
  offset?: number;
}

export interface ReloadlyProductsParams {
  limit?: number;
  offset?: number;
  country?: string;
  categoryId?: number;
  search?: string;
  includeRange?: boolean;
  includeFixed?: boolean;
}

// Reloadly API services
// Reloadly Product Category interfaces
export interface ProductCategory {
  id: number;
  name: string;
}

export interface ProductCategoriesResponse {
  success: boolean;
  data: ProductCategory[];
}

// Reloadly API services
export const reloadlyService = {
  // Get product categories
  getProductCategories: async (): Promise<ApiResponse<ProductCategory[]>> => {
    return await apiClient.get<ProductCategory[]>('/reloadly/product-categories');
  },

    getCountries: async (): Promise<ApiResponse<any[]>> => {
    return await apiClient.get<any[]>('/reloadly/countries');
  },

  // Get products with pagination and filters
  getProducts: async (params: ReloadlyProductsParams = {}): Promise<ApiResponse<ReloadlyProduct[]>> => {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('size', params.limit.toString());
    if (params.offset) queryParams.append('page', (Math.floor(params.offset / (params.limit || 1))).toString());
    if (params.country) queryParams.append('countryCode', params.country);
    if (params.categoryId) queryParams.append('productCategoryId', params.categoryId.toString());
    if (params.search) queryParams.append('productName', params.search);
    if (params.includeRange !== undefined) queryParams.append('includeRange', params.includeRange ? 'true' : 'false');
    if (params.includeFixed !== undefined) queryParams.append('includeFixed', params.includeFixed ? 'true' : 'false');
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/reloadly/products?${queryString}` : '/reloadly/products';
    return await apiClient.get<ReloadlyProduct[]>(endpoint);
  },
};
import apiClient, { ApiResponse } from './apiClient';

// Card freeze status types
export interface NairaCardFreezeStatusData {
  card_id: string;
  status: 'active' | 'inactive' | string;
  frozen: boolean;
  source?: 'cached' | 'upstream' | string;
}
export interface NairaCardFreezeStatusResponse {
  success: boolean;
  data: NairaCardFreezeStatusData;
}
// Naira Freeze request
export interface NairaCardFreezeRequest {
  action: boolean; // true => freeze, false => unfreeze
  card_type: 'naira';
}

// Naira Card status update request (new API contract)
export interface NairaCardUpdateRequest {
  status: 'active' | 'inactive';
}

export interface DollarCardFreezeStatusData {
  card_id: number;
  status: 'active' | 'inactive' | string;
  frozen: boolean;
  source?: 'cached' | 'upstream' | string;
}
export interface DollarCardFreezeStatusResponse {
  success: boolean;
  data: DollarCardFreezeStatusData;
}

// Dollar Card API services
export interface DollarCardFreezeRequest {
  action: boolean; // true => freeze, false => unfreeze
  card_type: 'dollar';
}

export interface DollarCardFundRequest {
  // Keep generic to match backend; amount is typical, allow extra fields (e.g., source)
  amount: number;
  [key: string]: any;
}

export const dollarCardService = {
  // Freeze or unfreeze the dollar card
  toggleFreeze: async (action: boolean): Promise<ApiResponse<any>> => {
    const body: DollarCardFreezeRequest = { action, card_type: 'dollar' };
    return await apiClient.post<any>('/dollar-card/freeze', body);
  },

  // Get freeze status for the dollar card
  getFreezeStatus: async (): Promise<ApiResponse<DollarCardFreezeStatusResponse['data']>> => {
    return await apiClient.get<DollarCardFreezeStatusResponse['data']>('/dollar-card/freeze-status');
  },

  // Quote funding cost in NGN for a USD amount
  quoteFunding: async (amount: number): Promise<ApiResponse<any>> => {
    // API expects only { amount }
    return await apiClient.post<any>('/dollar-card/fund/quote', { amount });
  },

  // Fund the dollar card; caller supplies payload (at least amount)
  fund: async (payload: DollarCardFundRequest): Promise<ApiResponse<any>> => {
    const body = { card_type: 'dollar', ...payload };
    return await apiClient.post<any>('/dollar-card/fund', body);
  },

  // Get transactions from DB with pagination
  getTransactionsDb: async (
    params: { limit?: number; offset?: number; sort?: 'asc' | 'desc' } = {}
  ): Promise<ApiResponse<{
    success: boolean;
    message?: string;
    data: Array<{
      id: string;
      amount: number;
      balance_after?: number;
      card_id: string;
      description?: string;
      reference: string;
      savedAt: string;
      status: string; // 'success' | 'failed' | ...
      transaction_date: string;
      transaction_id: string;
      txId: string;
      type: string;
      flow: 'debit' | 'credit' | string;
    }>;
    total?: number;
  }>> => {
    const q = {
      limit: params.limit ?? 50,
      offset: params.offset ?? 0,
      sort: params.sort ?? 'desc',
    };
    return await apiClient.get('/dollar-card/transactions/db', q);
  },
};

// Naira Card API services (freeze status)
export const nairaCardService = {
  // Get freeze status for the naira card
  getFreezeStatus: async (): Promise<ApiResponse<NairaCardFreezeStatusResponse['data']>> => {
    return await apiClient.get<NairaCardFreezeStatusResponse['data']>('/naira-card/freeze-status');
  },
  // Freeze or unfreeze the naira card
  toggleFreeze: async (freeze: boolean): Promise<ApiResponse<any>> => {
    // New endpoint expects PUT with explicit status field
    const body: NairaCardUpdateRequest = { status: freeze ? 'inactive' : 'active' };
    return await apiClient.put<any>('/naira-card/update', body);
  },
  
  // Physical card details
  getPhysicalDetails: async (): Promise<ApiResponse<{
    available_balance?: string;
    cardId?: string;
    card_brand?: string;
    card_created_date?: string;
    card_id?: string;
    card_status?: string;
    card_type?: string;
    card_user_id?: string;
    card_variant?: string; // 'physical'
    createdAt?: string;
    currency?: string; // 'NGN'
    customer_id?: string;
    ledger_balance?: string;
    reference?: string;
    updatedAt?: string;
  }>> => {
    return await apiClient.get('/naira-card/physical/details');
  },

  // Physical card transactions
  getPhysicalTransactions: async (): Promise<ApiResponse<{
    success: boolean;
    message?: string;
    data: Array<{
      id?: string;
      amount?: number | string;
      status?: string;
      description?: string;
      reference?: string;
      transaction_date?: string;
      flow?: string;
    }>;
    total?: number;
  }>> => {
    return await apiClient.get('/naira-card/physical/transactions');
  },

  // Apply for a physical naira card
  applyPhysical: async (payload: {
    full_name: string;
    address: string;
    state: string;
    phone: string;
    stateShortCode: string;
    city: string;
    lga: string;
  }): Promise<ApiResponse<{ id?: string; message?: string }>> => {
    return await apiClient.post<{ id?: string; message?: string }>('/naira-card/apply-physical', payload);
  },
  
  // Get transactions from DB with pagination
  getTransactionsDb: async (
    params: { limit?: number; offset?: number; sort?: 'asc' | 'desc' } = {}
  ): Promise<ApiResponse<{
    success: boolean;
    message?: string;
    data: Array<{
      id: string;
      card_id: string;
      currency: 'NGN' | string;
      merchant?: { name?: string } | null;
      reference: string;
      savedAt: string;
      transaction_date: string;
      transaction_id: string;
      txId: string;
      type: string; // e.g., purchase | refund
      flow: 'debit' | 'credit' | string;
      amount?: number;
      status?: string;
      description?: string;
    }>;
    total?: number;
  }>> => {
    const q = {
      limit: params.limit ?? 50,
      offset: params.offset ?? 0,
      sort: params.sort ?? 'desc',
    };
    return await apiClient.get('/naira-card/transactions/db', q);
  },
};

// Type definitions
export interface AccountDetails {
  account_number: string;
  account_status: string;
  amount: number;
  bank_name: string;
  last_updated?: string;
  encryption_version?: string;
}

export interface AccountDetailsResponse {
  success: boolean;
  data: AccountDetails;
}

export interface UserProfile {
  account_number?: string; // Added this field from your API response
  email: string;
  fullname: string;
  phone: string;
  hasAppCode: boolean;
  hasTransactionPin: boolean;
  hasAccountNumber: boolean;
  hasWallet?: boolean; // Added this field from your API response
}

export interface UserProfileResponse {
  success: boolean;
  data: UserProfile;
}

export interface AirtimeRequest {
  phone: string;
  amount: string;
  network_id: string;
}

export interface AirtimeResponse {
  order_id: number;
  status: string;
  product_name: string;
  service_name: string;
  phone: string;
  amount: number;
  discount: string;
  amount_charged: string;
  initial_balance: string;
  final_balance: string;
  request_id: string;
  transactionRef: string;
}

export interface AirtimeApiResponse {
  success: boolean;
  message: string;
  data: AirtimeResponse;
}

export interface DataPlan {
  variation_id: number;
  service_name: string;
  service_id: string;
  data_plan: string;
  price: string;
  availability: string;
}

export interface DataPlansResponse {
  code: string;
  message: string;
  product: string;
  data: DataPlan[];
}

export interface DataRequest {
  phone: string;
  service_id: string;
  variation_id: string;
  amount: string;
}

export interface DataResponse {
  order_id: number;
  status: string;
  product_name: string;
  variation_id: string;
  service_name: string;
  data_plan: string;
  phone: string;
  amount: string;
  discount: string;
  amount_charged: string;
  initial_balance: string;
  final_balance: string;
  request_id: string;
}

export interface DataApiResponse {
  success: boolean;
  message: string;
  data: DataResponse;
}

// Bank and Transfer related interfaces
export interface Bank {
  id: number;
  name: string;
  slug: string;
  code: string;
  longcode: string;
  gateway: string;
  pay_with_bank: boolean;
  supports_transfer: boolean;
  available_for_direct_debit: boolean;
  active: boolean;
  country: string;
  currency: string;
  type: string;
  is_deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BanksResponse {
  success: boolean;
  message: string;
  data: Bank[];
}

export interface AccountVerificationRequest {
  account_number: string;
  bank_code: string;
}

export interface AccountVerificationData {
  account_number: string;
  account_name: string;
  bank_id: number;
}

export interface AccountVerificationResponse {
  success: boolean;
  message: string;
  data: AccountVerificationData;
}

export interface CableVerificationRequest {
  service_id: string;
  customer_id: string;
}

export interface CableCustomerInfo {
  service_name: string;
  customer_id: string;
  customer_name: string;
  status: string;
  due_date: string;
  balance: string;
  current_bouquet: string;
  renewal_amount: string;
}

export interface CableVerificationResponse {
  success: boolean;
  message: string;
  data: CableCustomerInfo;
}

export interface CableVariation {
  variation_id: number;
  service_name: string;
  service_id: string;
  package_bouquet: string;
  price: string;
  availability: string;
  discounted_amount: string | null;
  discount_percentage: string;
}

export interface CableVariationsResponse {
  success: boolean;
  message: string;
  data: CableVariation[];
}

export interface CableSubscriptionRequest {
  customer_id: string;
  service_id: string;
  variation_id: number;
}

export interface CableSubscriptionResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface ElectricityVerificationRequest {
  meter_number: string;
  service_id: string;
  variation_id: string;
}

export interface ElectricityCustomerInfo {
  customer_name: string;
  customer_number: string;
  customer_address: string;
  meter_number: string;
  customer_type: string;
  tariff: string;
  balance?: string;
  due_date?: string;
}

export interface ElectricityVerificationResponse {
  success: boolean;
  message: string;
  data: ElectricityCustomerInfo;
}

// Transaction types
export interface Transaction {
  id: string;
  transactionId: string;
  amount: number;
  type: string;
  status?: 'completed' | 'failed' | 'pending' | 'refunded';
  description?: string;
  createdAt: string;
  currency?: string;
  flow?: 'debit' | 'credit';
  reference?: string;
}

export interface TransactionDetailsResponse {
  success: boolean;
  message: string;
  data: Transaction;
}

export interface TransactionSummary {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  totalAmount: string;
}

export interface TransactionsByType {
  [key: string]: {
    count: number;
    amount: string;
  };
}

export interface TransactionStatsResponse {
  success: boolean;
  message: string;
  data: {
    period: number;
    summary: TransactionSummary;
    byType: TransactionsByType;
    recentTransactions: Transaction[];
  };
}

export interface TransactionListResponse {
  success: boolean;
  message: string;
  data: Transaction[];
  total: number;
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface TransactionListParams {
  limit?: number;
  offset?: number;
  status?: string;
  type?: string;
  flow?: string;
  startDate?: string;
  endDate?: string;
}

// Virtual Number types
export interface VirtualNumber {
  activationId: number;
  country: string;
  createdAt: string;
  created_at: string;
  expires: string;
  id: number;
  operator: string;
  phone: string;
  price: number;
  product: string;
  purchaseId: string;
  status: string;
  type: string;
}

export interface VirtualNumberResponse {
  success: boolean;
  data: VirtualNumber[];
  count: number;
}

export interface VirtualNumberProductsByService {
  [serviceCode: string]: {
    [operatorCode: string]: {
      cost: number;
      count: number;
      rate?: number;
    };
  };
}

export interface VirtualNumberProductsResponse {
  success: boolean;
  data: VirtualNumberProductsByService;
}

export interface SMSMessage {
  created_at: string;
  date: string;
  sender: string;
  text: string;
  code: string | null;
}

// Virtual number SMS data payload (server response is { success, data })
export interface VirtualNumberSMSData {
  sms: SMSMessage[];
}

// ---- Virtual Number Purchase Typings ----
export interface BuyVirtualNumberRequest {
  country: string; // backend expects slug (e.g., 'nigeria')
  operator: string; // e.g., 'virtual2'
  product: string; // service / product code e.g., 'amazon'
  transaction_pin?: string; // optional; required if backend enforces PIN validation
}

export interface VirtualNumberPurchaseData {
  activationId: number;
  phone: string;
  status: string; // e.g., RECEIVED
  cost: number;
  country: string;
  operator: string;
  product: string;
  // Some backends may return additional fields like expires, purchaseId etc. Keep index signature.
  [key: string]: any;
}

export interface BuyVirtualNumberResponse {
  success: boolean;
  message?: string;
  data: VirtualNumberPurchaseData;
  error?: string; // preserve generic ApiResponse shape when merged
}

export interface NotificationUnreadCountResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
  };
}

export interface NotificationData {
  amount?: number;
  description?: string;
  status?: string;
  transactionId?: string;
  transactionType?: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  userId: string;
  data?: NotificationData;
}

export interface NotificationsResponse {
  success: boolean;
  message: string;
  data: Notification[];
}

// Recipient interfaces
export interface RecipientRequest {
  account_number: string;
  bank_code: string;
  name: string;
}

export interface RecipientData {
  recipient_code: string;
  name: string;
  account_number: string;
  bank_code: string;
  bank_name: string;
  type: string;
  currency: string;
  active: boolean;
  paystack_id: number;
  id: string;
}

export interface RecipientResponse {
  success: boolean;
  message: string;
  data: RecipientData;
}

// Transfer interfaces
export interface TransferRequest {
  amount: string;
  pin: string;
  recipient_code: string;
}

export interface TransferData {
  transfer_code: string;
  reference: string;
  amount: number;
  status: string;
  id: string;
}

export interface TransferResponse {
  success: boolean;
  message: string;
  data: TransferData;
}

// PIN Change interfaces
export interface PinChangeRequest {
  oldPin: string;
  newPin: string;
  otp?: string;
}

export interface PinChangeResponse {
  success: boolean;
  message: string;
}

// Account API services
export const accountService = {
  // Fetch account details
  getAccountDetails: async (): Promise<ApiResponse<AccountDetails>> => {
    return await apiClient.get<AccountDetails>('/accounts/details');
  },
  
  // Fetch user profile
  getUserProfile: async (): Promise<ApiResponse<UserProfile>> => {
    return await apiClient.get<UserProfile>('/accounts/me');
  },
  
  // Submit identity (NIN) details (ninBack optional to allow front-only early submission)
  submitIdentity: async (payload: { ninFront: string; nin: string; ninBack?: string }): Promise<ApiResponse<{ verified?: boolean }>> => {
    return await apiClient.post<{ verified?: boolean }>('/accounts/identity/submit', payload);
  },
  
  // Get identity (KYC) status
  getIdentityStatus: async (): Promise<ApiResponse<{
    submitted: boolean;
    verified: boolean;
    submittedAt?: number;
    hasNinFront?: boolean;
    hasNinBack?: boolean;
  }>> => {
    return await apiClient.get<{
      submitted: boolean;
      verified: boolean;
      submittedAt?: number;
      hasNinFront?: boolean;
      hasNinBack?: boolean;
    }>('/accounts/identity/status');
  },
};

// Notification API services
export const notificationService = {
  // Get unread notification count
  getUnreadCount: async (): Promise<ApiResponse<{ count: number }>> => {
    return await apiClient.get<{ count: number }>('/notifications/unread-count');
  },
  
  // Get all notifications
  getNotifications: async (): Promise<ApiResponse<Notification[]>> => {
    return await apiClient.get<Notification[]>('/notifications');
  },
  
  // Mark all notifications as read
  markAllAsRead: async (): Promise<ApiResponse<any>> => {
    return await apiClient.put<any>('/notifications/read-all', {});
  },
};

// VTU API services
export const vtuService = {
  // Buy airtime
  buyAirtime: async (request: AirtimeRequest): Promise<ApiResponse<AirtimeResponse>> => {
    return await apiClient.post<AirtimeResponse>('/vtu/buyairtime', request);
  },
};

// Data API services
export const dataService = {
  // Get data plans for a network
  getDataPlans: async (serviceId: string): Promise<ApiResponse<DataPlan[]>> => {
    return await apiClient.get<DataPlan[]>(`/vtu/data-plans/${serviceId}`);
  },
  
  // Buy data
  buyData: async (request: DataRequest): Promise<ApiResponse<DataResponse>> => {
    return await apiClient.post<DataResponse>('/vtu/buydata', request);
  },
};

// Cable API services
export const cableService = {
  // Verify cable subscription
  verifyCable: async (request: CableVerificationRequest): Promise<ApiResponse<CableCustomerInfo>> => {
    return await apiClient.post<CableCustomerInfo>('/cable/verify', request);
  },

  // Get cable variations/plans for a service
  getCableVariations: async (serviceId: string): Promise<ApiResponse<CableVariation[]>> => {
    return await apiClient.get<CableVariation[]>(`/cable/variations/${serviceId}`);
  },

  // Subscribe to cable plan
  subscribeCable: async (request: CableSubscriptionRequest): Promise<ApiResponse<any>> => {
    return await apiClient.post<any>('/cable/subscribe', request);
  },
};

// Electricity API services
export const electricityService = {
  // Verify electricity meter
  verifyMeter: async (request: ElectricityVerificationRequest): Promise<ApiResponse<ElectricityCustomerInfo>> => {
    return await apiClient.post<ElectricityCustomerInfo>('/utility/verify-meter', request);
  },
};

// Transaction API services
export const transactionService = {
  // Get transaction statistics and recent transactions
  getTransactionStats: async (): Promise<ApiResponse<TransactionStatsResponse['data']>> => {
    return await apiClient.get<TransactionStatsResponse['data']>('/transactions/recents');
  },
  
  // Get recent transactions directly (matches your actual API response)
  getRecentTransactions: async (params?: { limit?: number }): Promise<ApiResponse<Transaction[]>> => {
    // Supports optional limit param, e.g., { limit: 5 }
    return await apiClient.get<Transaction[]>('/transactions/recents', params);
  },
  
  // Get individual transaction by ID
  getTransactionById: async (transactionId: string): Promise<ApiResponse<Transaction>> => {
    return await apiClient.get<Transaction>(`/transactions/${transactionId}`);
  },
  
  // Get all transactions with pagination and filtering
  getTransactions: async (params?: TransactionListParams): Promise<ApiResponse<TransactionListResponse>> => {
    const queryParams = new URLSearchParams();
    
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.flow) queryParams.append('flow', params.flow);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/transactions?${queryString}` : '/transactions';
    
    return await apiClient.get<TransactionListResponse>(endpoint);
  },
};

// Virtual Number API services
export const virtualNumberService = {
  // Get purchased virtual numbers
  getPurchasedNumbers: async (): Promise<ApiResponse<VirtualNumberResponse>> => {
    return await apiClient.get<VirtualNumberResponse>('/virtual-numbers/purchases');
  },
  
  // Get virtual number products/countries
  getVirtualNumberProducts: async (): Promise<ApiResponse<VirtualNumberProductsResponse>> => {
    return await apiClient.get<VirtualNumberProductsResponse>('/virtual-numbers/products');
  },
  
  // Get pricing for a specific country
  getVirtualNumberPricing: async (country: string): Promise<ApiResponse<VirtualNumberProductsResponse>> => {
    return await apiClient.get<VirtualNumberProductsResponse>(`/virtual-numbers/prices/${country}`);
  },
  
  // Get SMS messages for a virtual number
  getSMSMessages: async (numberId: string): Promise<ApiResponse<VirtualNumberSMSData>> => {
    return await apiClient.get<VirtualNumberSMSData>(`/virtual-numbers/sms/${numberId}`);
  },

  // Buy a virtual number
  buyVirtualNumber: async (payload: BuyVirtualNumberRequest): Promise<ApiResponse<VirtualNumberPurchaseData>> => {
    return await apiClient.post<VirtualNumberPurchaseData>('/virtual-numbers/buy', payload);
  },
};

// eSIM purchases/interfaces
export interface EsimPurchase {
  id: string;
  product?: string;
  status?: string;
  phone?: string;
  country?: string;
  purchasedAt?: string | number;
  // add other fields returned by your backend as needed
}

export interface EsimPurchasesResponse {
  success: boolean;
  data: EsimPurchase[];
}

export const esimService = {
  // Get purchased eSIMs/orders
  getPurchasedEsims: async (): Promise<ApiResponse<EsimPurchasesResponse>> => {
    return await apiClient.get<EsimPurchasesResponse>('/esim/purchases');
  },
  /**
   * Get Airalo user purchases
   * Endpoint: GET /airalo/user-purchases
   * Returns an array (data) of current user Airalo purchases/orders
   */
  getAiraloUserPurchases: async (): Promise<ApiResponse<{ id: string | number; status?: string; phone?: string; product?: string; country?: string; purchasedAt?: string | number }[]>> => {
    return await apiClient.get<ApiResponse<{ id: string | number; status?: string; phone?: string; product?: string; country?: string; purchasedAt?: string | number }[]>>('/airalo/user-purchases') as unknown as ApiResponse<{ id: string | number; status?: string; phone?: string; product?: string; country?: string; purchasedAt?: string | number }[]>;
  },
  
  // --- Airalo operators (country-level) -----------------
  // Response shape example:
  // {
  //   success: true,
  //   data: [ { id, title, style, gradient_start, gradient_end, type, is_prepaid, esim_type, image, country, packages_count } ],
  //   meta: { message, total, from_cache, country }
  // }
  
  // Types for Airalo operators endpoint
  getAiraloOperators: async (country: string): Promise<ApiResponse<{
    id: number;
    title: string;
    style?: string;
    gradient_start?: string;
    gradient_end?: string;
    type?: string;
    is_prepaid?: boolean;
    esim_type?: string;
    image?: { width: number; height: number; url: string };
    country?: { slug: string; country_code: string; title: string };
    packages_count?: number;
  }[]>> => {
    const endpoint = `/airalo/countries/${encodeURIComponent(country)}/operators`;
    return await apiClient.get<{
      id: number;
      title: string;
      style?: string;
      gradient_start?: string;
      gradient_end?: string;
      type?: string;
      is_prepaid?: boolean;
      esim_type?: string;
      image?: { width: number; height: number; url: string };
      country?: { slug: string; country_code: string; title: string };
      packages_count?: number;
    }[]>(endpoint);
  },
  
  // Get packages for an Airalo operator in a country
  getAiraloPackages: async (country: string, operatorId: string | number): Promise<ApiResponse<{
    id: string;
    type: string;
    price: number;
    amount: number;
    day: number;
    is_unlimited: boolean;
    title: string;
    short_info?: string | null;
    qr_installation?: string | null;
    manual_installation?: string | null;
    is_fair_usage_policy?: boolean;
    fair_usage_policy?: string | null;
    data?: string | null;
    voice?: string | null;
    text?: string | null;
    net_price?: number;
    prices?: Record<string, any>;
    operator_info?: { id: number; title: string; style?: string; type?: string };
    country_info?: { slug: string; country_code: string; title: string };
    price_ngn?: number;
    net_price_ngn?: number;
    exchange_rate_info?: { usd_to_ngn_rate: number; last_updated?: string };
  }[]>> => {
    const endpoint = `/airalo/countries/${encodeURIComponent(country)}/operators/${operatorId}/packages`;
    return await apiClient.get<{
      id: string;
      type: string;
      price: number;
      amount: number;
      day: number;
      is_unlimited: boolean;
      title: string;
      short_info?: string | null;
      qr_installation?: string | null;
      manual_installation?: string | null;
      is_fair_usage_policy?: boolean;
      fair_usage_policy?: string | null;
      data?: string | null;
      voice?: string | null;
      text?: string | null;
      net_price?: number;
      prices?: Record<string, any>;
      operator_info?: { id: number; title: string; style?: string; type?: string };
      country_info?: { slug: string; country_code: string; title: string };
      price_ngn?: number;
      net_price_ngn?: number;
      exchange_rate_info?: { usd_to_ngn_rate: number; last_updated?: string };
    }[]>(endpoint);
  },

  // Purchase eSIM package
  purchasePackage: async (packageId: string, operatorId: string | number): Promise<ApiResponse<any>> => {
    const endpoint = `/airalo/orders?packageId=${encodeURIComponent(packageId)}&operatorId=${operatorId}`;
    return await apiClient.post<any>(endpoint, {});
  },
};

// Crypto (buy coins) interfaces & service
export interface CryptoCoin {
  id: string;
  name: string;
  symbol: string;
  network: string;
  icon?: string;
  address?: string;
  current_price_naira: number;
  available_balance: number;
  decimals: number;
  status: string;
}

export interface CryptoCoinsResponse {
  success: boolean;
  coins: CryptoCoin[];
  message?: string;
}

export const cryptoService = {
  // Fetch supported coins for buying
  getBuyCoins: async (): Promise<ApiResponse<CryptoCoinsResponse>> => {
    return await apiClient.get<CryptoCoinsResponse>('/crypto/buy/coins');
  },
};

// BVN verification interfaces
export interface BvnVerificationRequest {
  bvn: string;
}

export interface BvnVerificationData {
  sessionId: string;
  maskedPhone: string;
  expiresIn: number;
  name: string;
  lastThree?: string;
  bvnData?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
  };
}

export interface BvnVerificationResponse {
  success: boolean;
  message: string;
  data: BvnVerificationData;
}

// Dojah BVN flow interfaces
export interface BvnStartRequest { bvn: string }
export interface BvnStartData extends BvnVerificationData {}

export interface BvnPhoneRequest { completePhone: string; sessionId: string }
export interface BvnPhoneData { otpId: string; message: string }

export interface BvnVerifyRequest { otpCode: string; otpId: string }
export interface BvnVerifyData {
  phoneNumber?: string;
  verified?: boolean;
  verification?: {
    verificationStatus?: string; // e.g., 'completed'
    bvnVerified?: boolean;
    phoneVerified?: boolean;
    userProfile?: {
      firstName?: string;
      middleName?: string;
      lastName?: string;
      dateOfBirth?: string;
      phoneNumber?: string;
    };
  };
  fullyVerified?: boolean;
  requiresAdminReview?: boolean;
}

export interface BvnResendOtpRequest { sessionId: string }
export interface BvnResendOtpData { otpId: string; message: string }

// Dojah BVN API services
export const bvnService = {
  start: async (payload: BvnStartRequest): Promise<ApiResponse<BvnStartData>> => {
    return await apiClient.post<BvnStartData>('/accounts/dojah/bvn/start', payload);
  },
  submitPhone: async (payload: BvnPhoneRequest): Promise<ApiResponse<BvnPhoneData>> => {
    return await apiClient.post<BvnPhoneData>('/accounts/dojah/bvn/phone', payload);
  },
  verifyOtp: async (payload: BvnVerifyRequest): Promise<ApiResponse<BvnVerifyData>> => {
    return await apiClient.post<BvnVerifyData>('/accounts/dojah/bvn/verify', payload);
  },
  resendOtp: async (payload: BvnResendOtpRequest): Promise<ApiResponse<BvnResendOtpData>> => {
    return await apiClient.post<BvnResendOtpData>('/accounts/dojah/bvn/resend-otp', payload);
  },
};

// Transfer and Banking API services
export const transferService = {
  // Verify BVN
  verifyBvn: async (request: BvnVerificationRequest): Promise<ApiResponse<BvnVerificationData>> => {
    return await apiClient.post<BvnVerificationData>('/accounts/verify-bvn-simple', request);
  },
  
  // Get list of available banks
  getBanks: async (): Promise<ApiResponse<BanksResponse['data']>> => {
    return await apiClient.get<BanksResponse['data']>('/paystack/banks');
  },
  
  // Verify account number
  verifyAccount: async (request: AccountVerificationRequest): Promise<ApiResponse<AccountVerificationData>> => {
    return await apiClient.post<AccountVerificationData>('/paystack/verify-account', request);
  },
  
  // Create recipient for transfer
  createRecipient: async (request: RecipientRequest): Promise<ApiResponse<RecipientData>> => {
    return await apiClient.post<RecipientData>('/paystack/recipients', request);
  },
  
  // Process transfer
  processTransfer: async (request: TransferRequest): Promise<ApiResponse<TransferData>> => {
    return await apiClient.post<TransferData>('/paystack/transfer', request);
  },

  // Set transaction PIN
  setTransactionPin: async (pin: string): Promise<ApiResponse<{ message: string }>> => {
    return await apiClient.post<{ message: string }>('/transfers/set-transaction-pin', { pin });
  },
};

// User API services
export const userService = {
  // Request transaction PIN reset (send OTP)
  requestTransactionPinReset: async (): Promise<ApiResponse<{ otpId: string; message?: string }>> => {
    return await apiClient.post<{ otpId: string; message?: string }>(
      '/transactions/pin/reset/request'
    );
  },

  // Confirm OTP for transaction PIN reset
  confirmTransactionPinReset: async (
    payload: { otpId: string; otpCode: string }
  ): Promise<ApiResponse<{ verified: boolean; phoneNumber?: string }>> => {
    return await apiClient.post<{ verified: boolean; phoneNumber?: string }>(
      '/transactions/pin/reset/confirm',
      payload
    );
  },

  // Change transaction PIN
  changeTransactionPin: async (request: PinChangeRequest): Promise<ApiResponse<{ message: string }>> => {
    
    return await apiClient.post<{ message: string }>('/transactions/pin/change', request);
  },
};

// Referrals API services
export const referralService = {
  // Get user referral code
  getReferralCode: async (): Promise<ApiResponse<{ code: string }>> => {
    return await apiClient.get<{ code: string }>('/referrals/code');
  },
  // Apply a referral code for reward
  applyCode: async (code: string): Promise<ApiResponse<{ message?: string }>> => {
    return await apiClient.post<{ message?: string }>('/referrals/apply', { code });
  },
};

// Sizzle (Social Media Growth) interfaces
export interface SizzleService {
  service: string;
  name: string;
  category: string;
  rate: number;
  min: string;
  max: string;
  type: string;
  desc: string;
  dripfeed: string;
  originalName: string;
  originalRate: number;
  markup: number;
  currency: string;
}

export interface SizzleServicesResponse {
  success: boolean;
  message: string;
  data: SizzleService[];
}

export interface SizzleOrderRequest {
  service_id: string;
  link: string;
  email: string;
  quantity: number;
  transaction_pin: string;
}

export interface SizzleOrderData {
  order_id: string;
  status: string;
  amount: number;
  service_name: string;
}

export interface SizzleOrderResponse {
  success: boolean;
  message: string;
  data: SizzleOrderData;
}

// Sizzle API services
export const sizzleService = {
  // Get all available services
  getServices: async (): Promise<ApiResponse<SizzleService[]>> => {
    return await apiClient.get<SizzleService[]>('/sizzle/services');
  },
  
  // Place a sizzle order
  placeOrder: async (request: SizzleOrderRequest): Promise<ApiResponse<SizzleOrderData>> => {
    return await apiClient.post<SizzleOrderData>('/sizzle/order', request);
  },
};

export default apiClient;
