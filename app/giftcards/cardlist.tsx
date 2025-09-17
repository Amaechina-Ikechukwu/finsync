import { ThemedView } from '@/components/ThemedView';
import SimpleTabs from '@/components/ui/SimpleTabs';
import { useNavigation } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import BoughtHostedCards from './BoughtHostedCards';
import BoughtOnlineCards from './BoughtOnlineCards';

const CardListScreen = () => {
  const [activeTab, setActiveTab] = useState(0);
  const colorScheme = useColorScheme() ?? 'light';
  const navigation = useNavigation();

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: 'My Gift Cards',
      headerShown: true,
    });
  }, [navigation]);

  const tabs = ['Online Cards', 'Hosted Cards'];

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return <BoughtOnlineCards />;
      case 1:
        return <BoughtHostedCards />;
      default:
        return <BoughtOnlineCards />;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SimpleTabs 
        tabs={tabs}
        activeIndex={activeTab}
        onTabPress={setActiveTab}
      />
      {renderTabContent()}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default CardListScreen;