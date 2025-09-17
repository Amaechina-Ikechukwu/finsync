import { useNavigation } from 'expo-router';
import React, { useEffect } from 'react';
import CreateDollarCardCustomer from '../../../components/virtual cards/dollar/createdollarcardcustomer';

export default function Page() {
	const navigation = useNavigation();

	useEffect(() => {
		navigation.setOptions({
			title: 'Create Dollar Card',
			headerShown: true,
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [navigation]);

	return <CreateDollarCardCustomer />;
}
