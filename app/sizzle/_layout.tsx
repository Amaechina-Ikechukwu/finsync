import { Stack } from 'expo-router';

export default function SizzleLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
          title: 'Social Media Growth'
        }} 
      />
      <Stack.Screen 
        name="confirmation" 
        options={{ 
          headerShown: false,
          title: 'Confirm Order'
        }} 
      />
      <Stack.Screen 
        name="success" 
        options={{ 
          headerShown: false,
          title: 'Order Complete'
        }} 
      />
    </Stack>
  );
}
