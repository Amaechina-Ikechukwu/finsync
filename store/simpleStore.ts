import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { auth } from '@/firebase';
import { Transaction as ApiTransaction, Notification, TransactionSummary, TransactionsByType, accountService, notificationService, transactionService } from '@/services/apiService';

// Simple types
interface Transaction {
  id: number;
  title: string;
  amount: number;
  date: string;
  category: string;
  icon: string;
  type: 'income' | 'expense';
}

// API Transaction type mapping
interface TransactionWithDisplay extends ApiTransaction {
  title: string;
  date: string;
  category: string;
  icon: string;
  displayType: 'income' | 'expense';
}

interface Beneficiary {
  id: string;
  name: string;
  phone?: string; // Optional for betting services
  network?: string; // Optional, used for VTU services
  customerId?: string; // For betting services and cable/electricity
  serviceId?: string; // For betting services, cable, and electricity
  meterNumber?: string; // For electricity services
  variationId?: string; // For electricity services (prepaid/postpaid)
  accountNumber?: string; // For bank transfers
  bankName?: string; // For bank transfers
  bankCode?: string; // For bank transfers
  serviceType: 'vtu' | 'betting' | 'cable' | 'electricity' | 'transfer'; // Type of service
  dateAdded: string;
}

interface HostedCard {
  id: string;
  code: string;
  createdAt: number;
  imageUrl: string;
  name: string;
  price: number;
  sellerId: string;
  status: string;
  type: string;
  value: number;
  buyerId: string;
  revealed: boolean;
  escrow?: {
    amount: number;
    createdAt: number;
    held: boolean;
    processingFee: number;
    releasedAt?: number;
  };
}

interface OnlineCard {
  id: string;
  amount: number;
  product: {
    brand: {
      brandName: string;
    };
    productName: string;
  };
  status: string;
  currencyCode: string;
  productDetails?: {
    logoUrls?: string[];
  };
  customIdentifier?: string;
  transactionId?: string | number;
}

interface UserData {
  // From user profile API (/accounts/me)
  email: string;
  fullname: string;
  phone: string;
  hasAppCode: boolean;
  hasTransactionPin: boolean;
  hasAccountNumber: boolean;
  
  // From account details API (/accounts/details)
  account_number: string;
  account_status: string;
  amount: number;
  bank_name: string;
  
  // UI/App specific fields (not from API)
  avatar: string;
  routingNumber: string;
  currency: string;
}

interface AppState {
  // Data
  userData: UserData;
  // Crypto coins
  coins: any[];
  setCoins: (coins: any[]) => void;
  transactions: TransactionWithDisplay[];
  apiTransactions: ApiTransaction[];
  transactionSummary: TransactionSummary | null;
  transactionsByType: TransactionsByType | null;
  beneficiaries: Beneficiary[];
  
  // Gift Cards
  hostedCards: HostedCard[];
  hostedCardsLoading: boolean;
  hostedCardsError: string | null;
  hostedCardsLastFetch: number | null;
  
  // Online Cards
  onlineCards: OnlineCard[];
  onlineCardsLoading: boolean;
  onlineCardsError: string | null;
  onlineCardsLastFetch: number | null;
  
  // Notification state
  unreadNotificationCount: number;
  notifications: Notification[];
  isNotificationsLoading: boolean;
  
  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  hasInitiallyFetched: boolean;

  // Actions
  setUserData: (data: UserData) => void;
  setTransactions: (transactions: TransactionWithDisplay[]) => void;
  setApiTransactions: (transactions: ApiTransaction[]) => void;
  setTransactionSummary: (summary: TransactionSummary) => void;
  setTransactionsByType: (byType: TransactionsByType) => void;
  updateBalance: (newBalance: number) => void;
  addBeneficiary: (beneficiary: Omit<Beneficiary, 'id' | 'dateAdded'>) => { success: boolean; message: string };
  removeBeneficiary: (id: string) => void;
  
  // Hosted Cards Actions
  setHostedCards: (cards: HostedCard[]) => void;
  setHostedCardsLoading: (loading: boolean) => void;
  setHostedCardsError: (error: string | null) => void;
  fetchHostedCards: () => Promise<void>;
  clearHostedCards: () => void;
  
  // Online Cards Actions
  setOnlineCards: (cards: OnlineCard[]) => void;
  setOnlineCardsLoading: (loading: boolean) => void;
  setOnlineCardsError: (error: string | null) => void;
  fetchOnlineCards: () => Promise<void>;
  clearOnlineCards: () => void;
  fetchData: () => Promise<void>;
  refreshData: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  debugFetchData: () => Promise<void>;
  testApiConnection: () => Promise<void>;
  setUnreadNotificationCount: (count: number) => void;
  fetchUnreadNotificationCount: () => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  setNotifications: (notifications: Notification[]) => void;
  fetchNotifications: () => Promise<void>;
  setNotificationsLoading: (loading: boolean) => void;
}

// Default data - empty array, will be populated from API
const defaultTransactions: TransactionWithDisplay[] = [];

// Helper function to transform API transactions to display format
const transformApiTransaction = (apiTx: ApiTransaction): TransactionWithDisplay => {
  
  const getTransactionIcon = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'airtime': return 'phone.fill';
      case 'data': return 'wifi'; 
      case 'cable': return 'tv.fill';
      case 'electricity': return 'bolt.fill';
      case 'betting': return 'gamecontroller.fill';
      case 'virtual_number': return 'number.circle.fill';
      default: return 'creditcard.fill';
    }
  };

  const getTransactionCategory = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'airtime': return 'Airtime';
      case 'data': return 'Data Bundle';
      case 'cable': return 'Cable TV';
      case 'electricity': return 'Electricity';
      case 'betting': return 'Betting';
      case 'virtual_number': return 'Virtual Number';
      default: return 'Transaction';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (days === 1) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const transformedTransaction: TransactionWithDisplay = {
    ...apiTx,
    title: apiTx.description || apiTx.type || 'Transaction',
    date: formatDate(apiTx.createdAt),
    category: getTransactionCategory(apiTx.type),
    icon: getTransactionIcon(apiTx.type),
    displayType: (apiTx.flow === 'credit' ? 'income' : 'expense') as 'income' | 'expense',
  };
  
  return transformedTransaction;
};

export const useAppStore = create<AppState>()(
  persist(    (set, get) => ({
      // Initial state
      userData: {
        // User profile fields
        email: "Loading...",
        fullname: "Loading...",
        phone: "Loading...",
        hasAppCode: false,
        hasTransactionPin: false,
        hasAccountNumber: false,
        
        // Account details fields
        account_number: "Loading...",
        account_status: "INACTIVE",
        amount: 0,
        bank_name: "Loading...",
        
        // UI fields
        avatar: "",
        routingNumber: "000000000",
        currency: "USD"
      },
  // Crypto coins
  coins: [],
      transactions: defaultTransactions,
      apiTransactions: [],
      transactionSummary: null,
      transactionsByType: null,
      beneficiaries: [],
      
      // Hosted Cards initial state
      hostedCards: [],
      hostedCardsLoading: false,
      hostedCardsError: null,
      hostedCardsLastFetch: null,
      
      // Online Cards initial state
      onlineCards: [],
      onlineCardsLoading: false,
      onlineCardsError: null,
      onlineCardsLastFetch: null,
      
      unreadNotificationCount: 0,
      notifications: [],
      isNotificationsLoading: false,
      isLoading: false,
      isRefreshing: false,
      hasInitiallyFetched: false,

      // Actions
      setUserData: (data) => set({ userData: data }),
  // Crypto coins setter
  setCoins: (coins) => set({ coins }),
      setTransactions: (transactions) => set({ transactions }),
      setApiTransactions: (apiTransactions) => {
        
        // Transform API transactions to display format
        const transformedTransactions = apiTransactions.map(transformApiTransaction);
        set({ 
          apiTransactions, 
          transactions: transformedTransactions 
        });
        
      },
      setTransactionSummary: (summary) => set({ transactionSummary: summary }),
      setTransactionsByType: (byType) => set({ transactionsByType: byType }),
      updateBalance: (newBalance) => set((state) => ({
        userData: { ...state.userData, amount: newBalance }
      })),      addBeneficiary: (beneficiary) => {
        const { beneficiaries } = get();
          // Check for duplicates based on service type
        let existingBeneficiary;
        if (beneficiary.serviceType === 'vtu') {
          existingBeneficiary = beneficiaries.find(
            b => b.phone === beneficiary.phone && b.network === beneficiary.network && b.serviceType === 'vtu'
          );
        } else if (beneficiary.serviceType === 'betting') {
          existingBeneficiary = beneficiaries.find(
            b => b.customerId === beneficiary.customerId && b.serviceId === beneficiary.serviceId && b.serviceType === 'betting'
          );
        } else if (beneficiary.serviceType === 'cable') {
          existingBeneficiary = beneficiaries.find(
            b => b.customerId === beneficiary.customerId && b.serviceId === beneficiary.serviceId && b.serviceType === 'cable'
          );
        } else if (beneficiary.serviceType === 'electricity') {
          existingBeneficiary = beneficiaries.find(
            b => b.meterNumber === beneficiary.meterNumber && b.serviceId === beneficiary.serviceId && b.serviceType === 'electricity'
          );
        } else if (beneficiary.serviceType === 'transfer') {
          existingBeneficiary = beneficiaries.find(
            b => b.accountNumber === beneficiary.accountNumber && b.bankCode === beneficiary.bankCode && b.serviceType === 'transfer'
          );
        }
        
        if (existingBeneficiary) {
          let identifier;
          switch (beneficiary.serviceType) {
            case 'vtu':
              identifier = `${beneficiary.phone} (${beneficiary.network})`;
              break;
            case 'betting':
            case 'cable':
              identifier = `${beneficiary.customerId} (${beneficiary.serviceId})`;
              break;
            case 'electricity':
              identifier = `${beneficiary.meterNumber} (${beneficiary.serviceId})`;
              break;
            case 'transfer':
              identifier = `${beneficiary.accountNumber} (${beneficiary.bankName})`;
              break;
            default:
              identifier = 'Unknown';
          }
          return {
            success: false,
            message: `${existingBeneficiary.name} (${identifier}) is already saved as a beneficiary`
          };
        }
        
        const newBeneficiary: Beneficiary = {
          ...beneficiary,
          id: Date.now().toString(),
          dateAdded: new Date().toISOString(),
        };
        
        set((state) => ({
          beneficiaries: [...state.beneficiaries, newBeneficiary]
        }));
        
        return {
          success: true,
          message: `${beneficiary.name} saved as beneficiary`
        };
      },
      removeBeneficiary: (id) => {
        set((state) => ({
          beneficiaries: state.beneficiaries.filter(b => b.id !== id)
        }));
      },
      setLoading: (loading) => set({ isLoading: loading }),
      setRefreshing: (refreshing) => set({ isRefreshing: refreshing }),
      
      // Hosted Cards Actions
      setHostedCards: (cards) => set({ 
        hostedCards: cards, 
        hostedCardsLastFetch: Date.now(),
        hostedCardsError: null 
      }),
      setHostedCardsLoading: (loading) => set({ hostedCardsLoading: loading }),
      setHostedCardsError: (error) => set({ hostedCardsError: error }),
      fetchHostedCards: async () => {
        const { hostedCardsLastFetch } = get();
        const now = Date.now();
        
        // Cache for 5 minutes (300000 ms)
        if (hostedCardsLastFetch && (now - hostedCardsLastFetch) < 300000) {
          console.log('Using cached hosted cards data');
          return;
        }

        set({ hostedCardsLoading: true, hostedCardsError: null });
        try {
          const apiUrl = process.env.EXPO_PUBLIC_API_URL || '';
          const token = await auth.currentUser?.getIdToken();
          
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          };
          
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          
          const response = await fetch(`${apiUrl}/giftcards/buyer/me`, {
            method: 'GET',
            headers
          });
          
          const data = await response.json();
          
          if (data.success && Array.isArray(data.data)) {
            set({ 
              hostedCards: data.data,
              hostedCardsLastFetch: now,
              hostedCardsError: null,
              hostedCardsLoading: false
            });
          } else {
            set({ 
              hostedCardsError: 'Failed to load hosted cards',
              hostedCardsLoading: false
            });
          }
        } catch (error: any) {
          console.error('Error fetching hosted cards:', error);
          set({ 
            hostedCardsError: `Failed to load hosted cards: ${error?.message || 'Unknown error'}`,
            hostedCardsLoading: false
          });
        }
      },
      clearHostedCards: () => set({ 
        hostedCards: [], 
        hostedCardsLastFetch: null,
        hostedCardsError: null 
      }),
      
      // Online Cards Actions
      setOnlineCards: (cards) => set({ 
        onlineCards: cards, 
        onlineCardsLastFetch: Date.now(),
        onlineCardsError: null 
      }),
      setOnlineCardsLoading: (loading) => set({ onlineCardsLoading: loading }),
      setOnlineCardsError: (error) => set({ onlineCardsError: error }),
      fetchOnlineCards: async () => {
        const { onlineCardsLastFetch } = get();
        const now = Date.now();
        
        // Cache for 5 minutes (300000 ms)
        if (onlineCardsLastFetch && (now - onlineCardsLastFetch) < 300000) {
          console.log('Using cached online cards data');
          return;
        }

        set({ onlineCardsLoading: true, onlineCardsError: null });
        try {
          const apiClient = (await import('@/services/apiClient')).default;
          const res = await apiClient.get<{ data: OnlineCard[] }>('/reloadly/user-cards');
          
          if (res.success && res.data) {
            const cards = res.data.data ?? res.data;
            set({ 
              onlineCards: cards,
              onlineCardsLastFetch: now,
              onlineCardsError: null,
              onlineCardsLoading: false
            });
          } else {
            set({ 
              onlineCardsError: res.error || 'Failed to load cards',
              onlineCardsLoading: false
            });
          }
        } catch (error: any) {
          console.error('Error fetching online cards:', error);
          set({ 
            onlineCardsError: `Failed to load cards: ${error?.message || 'Unknown error'}`,
            onlineCardsLoading: false
          });
        }
      },
      clearOnlineCards: () => set({ 
        onlineCards: [], 
        onlineCardsLastFetch: null,
        onlineCardsError: null 
      }),
      
      fetchData: async () => {
        const { setLoading } = get();
        try {
          setLoading(true);
          
          // Check authentication first
          const currentUser = auth.currentUser;
          if (currentUser) {
            try {
              const token = await currentUser.getIdToken();
            } catch (tokenError) {
              console.error('❌ Error getting auth token:', tokenError);
            }
          } else {
            // Still try to continue, but this is likely the issue
          }
          
          // Start with current userData to preserve any existing real data
          let updatedUserData = { ...get().userData };
          
          // Fetch user profile
          try {
            const profileResponse = await accountService.getUserProfile();
            
            if (profileResponse.success && profileResponse.data) {
              // API returns data directly
              const profileData = profileResponse.data;
              
              // Only update if we got real data
              updatedUserData = {
                ...updatedUserData,
                fullname: profileData.fullname || updatedUserData.fullname,
                email: profileData.email || updatedUserData.email,
                phone: profileData.phone || updatedUserData.phone,
                hasAppCode: profileData.hasAppCode ?? updatedUserData.hasAppCode,
                hasTransactionPin: profileData.hasTransactionPin ?? updatedUserData.hasTransactionPin,
                hasAccountNumber: profileData.hasAccountNumber ?? updatedUserData.hasAccountNumber,
              };
            }
          } catch (error) {
          }
          
          // Fetch account details
          try {
            const accountResponse = await accountService.getAccountDetails();
            
            if (accountResponse.success && accountResponse.data) {
              // API returns data directly
              const accountData = accountResponse.data.data;
              // Only update if we got real data
              updatedUserData = {
                ...updatedUserData,
                account_number: accountData.account_number || updatedUserData.account_number,
                bank_name: accountData.bank_name || updatedUserData.bank_name,
                amount: accountData.amount !== undefined ? accountData.amount : updatedUserData.amount,
                account_status: accountData.account_status || updatedUserData.account_status
              };
            } else {
            }
          } catch (error) {
          }
          
          // Fetch recent transactions directly
          try {
            const transactionResponse = await transactionService.getRecentTransactions();
            if (transactionResponse.success && transactionResponse.data) {
              const recentTransactions = transactionResponse.data;
       
              
              // Set the API transactions which will trigger transformation to display format
              get().setApiTransactions(recentTransactions);
            }
          } catch (error) {
            console.error('Error fetching recent transactions:', error);
          }
          
          // Fetch notification count (optional)
          try {
            const notificationResponse = await notificationService.getUnreadCount();
            if (notificationResponse.success && notificationResponse.data) {
              set({ unreadNotificationCount: notificationResponse.data.count });
            }
          } catch (error) {
          }

          // Only update userData if we actually got new data
          set({ userData: updatedUserData, hasInitiallyFetched: true });
          
        } catch (error) {
          console.error('❌ Error in fetchData:', error);
          set({ hasInitiallyFetched: true });
        } finally {
          setLoading(false);
        }
      },

      refreshData: async () => {
        const { setRefreshing, fetchData } = get();
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
      },

      // Debug function to manually test API calls
      debugFetchData: async () => {
        
        try {
          const currentUser = auth.currentUser;
          if (currentUser) {
            const token = await currentUser.getIdToken();
          }
          
          const profileResponse = await accountService.getUserProfile();
          
          const accountResponse = await accountService.getAccountDetails();
          
        } catch (error) {
          console.error('🔬 Debug API test failed:', error);
        }
      },

      // Quick test function to see if APIs work at all
      testApiConnection: async () => {
        try {
          const profileTest = await accountService.getUserProfile();
          
          const accountTest = await accountService.getAccountDetails();
          
          if (profileTest.success && accountTest.success) {
            
            // API returns data directly (not nested)
            const profileData = profileTest.data;
            const accountData = accountTest.data;
            
            const userData = {
              ...get().userData,
              fullname: profileData?.fullname || get().userData?.fullname || "Unknown User",
              email: profileData?.email || get().userData?.email || "",
              phone: profileData?.phone || get().userData?.phone || "",
              hasAppCode: profileData?.hasAppCode ?? get().userData?.hasAppCode ?? false,
              hasTransactionPin: profileData?.hasTransactionPin ?? get().userData?.hasTransactionPin ?? false,
              hasAccountNumber: profileData?.hasAccountNumber ?? get().userData?.hasAccountNumber ?? false,
              account_number: accountData?.account_number || get().userData?.account_number || "",
              bank_name: accountData?.bank_name || get().userData?.bank_name || "",
              amount: accountData?.amount ?? get().userData?.amount ?? 0,
              account_status: accountData?.account_status || get().userData?.account_status || "INACTIVE",
              avatar: get().userData?.avatar || "",
              routingNumber: get().userData?.routingNumber || "",
              currency: get().userData?.currency || "USD"
            };
            set({ userData });
          }
        } catch (error) {
          console.error('🧪 API connection test failed:', error);
        }
      },

    

      // Notification functions
      setUnreadNotificationCount: (count) => set({ unreadNotificationCount: count }),
      
      fetchUnreadNotificationCount: async () => {
        try {
          const response = await notificationService.getUnreadCount();
          
          if (response.success && response.data) {
            const count = response.data.count;
            set({ unreadNotificationCount: count });
          } else {
          }
        } catch (error) {
          console.error('❌ Error fetching notification count:', error);
        }
      },
      
      markAllNotificationsRead: async () => {
        try {
          const response = await notificationService.markAllAsRead();
          if (response.success) {
            set({ unreadNotificationCount: 0 });
          }
        } catch (error) {
          console.error('❌ Error marking notifications as read:', error);
        }
      },
      
      setNotifications: (notifications) => set({ notifications }),
      
      setNotificationsLoading: (loading) => set({ isNotificationsLoading: loading }),
      
      fetchNotifications: async () => {
        try {
          set({ isNotificationsLoading: true });
          const response = await notificationService.getNotifications();
          
          if (response.success && response.data) {
            set({ notifications: response.data });
          } else {
          }
        } catch (error) {
          console.error('❌ Error fetching notifications:', error);
        } finally {
          set({ isNotificationsLoading: false });
        }
      },
    }),
    {
      name: 'app-storage-v3', // Changed name to force refresh with beneficiaries
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Persist transactions and beneficiaries, not userData so API data can override
        transactions: state.transactions,
        beneficiaries: state.beneficiaries,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState || {}),
        // Start with empty beneficiaries if none are persisted
        beneficiaries: (persistedState as any)?.beneficiaries || [],
      }),
    }
  )
);
