import { ApiService, useTransactions, useUserProfile } from '@/services';
import React, { useEffect } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';

// Example component showing different ways to use the API client
export default function ApiExampleComponent() {
  // Using hooks for automatic state management
  const {
    transactions,
    loading: transactionsLoading,
    error: transactionsError,
    fetchTransactions,
    createTransaction,
  } = useTransactions();

  const {
    profile,
    loading: profileLoading,
    error: profileError,
    fetchProfile,
    updateProfile,
  } = useUserProfile();

  // Load data on component mount
  useEffect(() => {
    fetchTransactions({ limit: 10 });
    fetchProfile();
  }, [fetchTransactions, fetchProfile]);

  // Example: Create a new transaction
  const handleCreateTransaction = async () => {
    const newTransaction = {
      amount: 100,
      description: 'Test transaction',
      category: 'Food',
      date: new Date().toISOString(),
      type: 'expense' as const,
    };

    const result = await createTransaction(newTransaction);
    if (result) {
      // Refresh the list
      fetchTransactions({ limit: 10 });
    }
  };

  // Example: Direct API call without hooks
  const handleDirectApiCall = async () => {
    const response = await ApiService.getFinancialSummary('month');
    if (response.success) {
    } else {
      console.error('Error:', response.error);
    }
  };

  // Example: Update user profile
  const handleUpdateProfile = async () => {
    const result = await updateProfile({
      name: 'Updated Name',
      phone: '+1234567890',
    });
    if (result) {
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>API Client Example</Text>

      {/* User Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Profile</Text>
        {profileLoading && <Text>Loading profile...</Text>}
        {profileError && <Text style={styles.error}>Error: {profileError}</Text>}
        {profile && (
          <View>
            <Text>Email: {profile.email}</Text>
            <Text>Name: {profile.name || 'Not set'}</Text>
          </View>
        )}
        <Button title="Update Profile" onPress={handleUpdateProfile} />
      </View>

      {/* Transactions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transactions</Text>
        {transactionsLoading && <Text>Loading transactions...</Text>}
        {transactionsError && <Text style={styles.error}>Error: {transactionsError}</Text>}
        {transactions && (
          <View>
            <Text>Total transactions: {transactions.total}</Text>
            {transactions.transactions.map((transaction: any) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <Text>{transaction.description}: ${transaction.amount}</Text>
              </View>
            ))}
          </View>
        )}
        <Button title="Create Transaction" onPress={handleCreateTransaction} />
      </View>

      {/* Direct API Calls */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Direct API Calls</Text>
        <Button title="Get Financial Summary" onPress={handleDirectApiCall} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  error: {
    color: 'red',
    marginVertical: 5,
  },
  transactionItem: {
    padding: 5,
    marginVertical: 2,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
});
