import CreateNairaCardCustomer from '@/components/virtual cards/naira/createnairacardcustomer';
import { useNavigation, useRouter } from 'expo-router';
import React, { useEffect } from 'react';

export default function Page() {
  const navigation = useNavigation();
  const router = useRouter();

  useEffect(() => {
    navigation.setOptions({
      title: 'Create Naira Card',
      headerShown: true,
   
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation]);

  return <CreateNairaCardCustomer />;
}
