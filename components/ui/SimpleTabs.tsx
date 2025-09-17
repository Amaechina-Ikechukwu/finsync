import React from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

interface TabProps {
  tabs: string[];
  activeIndex: number;
  onTabPress: (index: number) => void;
}

const SimpleTabs: React.FC<TabProps> = ({ tabs, activeIndex, onTabPress }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  return (
    <View style={[styles.tabRow, { backgroundColor: isDark ? '#181A20' : '#f3f4f6' }]}> 
      {tabs.map((tab, idx) => (
        <Pressable
          key={tab}
          style={[
            styles.tab,
            activeIndex === idx && {
              backgroundColor: isDark ? '#23262F' : '#fff',
              borderBottomColor: isDark ? '#fff' : '#222',
              borderBottomWidth: 3,
            },
          ]}
          onPress={() => onTabPress(idx)}
        >
          <Text style={{ color: isDark ? '#fff' : '#222', fontWeight: activeIndex === idx ? 'bold' : '500' }}>{tab}</Text>
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0,
  },
});

export default SimpleTabs;
