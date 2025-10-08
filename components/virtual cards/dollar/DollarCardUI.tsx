import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import TransactionPinModal from '@/components/TransactionPinModal';
import TransactionPinSetupModal from '@/components/TransactionPinSetupModal';
import AppButton from '@/components/ui/AppButton';
import CustomAlert from '@/components/ui/CustomAlert';
import FSActivityLoader from '@/components/ui/FSActivityLoader';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import apiClient from '@/services/apiClient';
import { dollarCardService } from '@/services/apiService';
import { useAppStore } from '@/store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CardActionsContainer from './CardActionsContainer';
import DollarCardTransactions from './DollarCardTransactions';

type BillingAddress = {
	line1?: string;
	city?: string;
	state?: string;
	country?: string;
};

type DollarCardData = {
	id?: number;
	user_id?: number;
	card_holder_name?: string;
	card_name?: string;
	card_id?: string;
	card_created_date?: string;
	card_type?: string;
	card_brand?: string;
	card_user_id?: string;
	reference?: string;
	card_status?: string;
	card_number: string;
	last4?: string;
	cvv?: string;
	expiry?: string; // e.g. "12/25"
	customer_email?: string;
	customer_id?: string;
	default_pin?: string;
	balance?: number;
	created_at?: string;
	updated_at?: string;
	billing_country?: string;
	billing_city?: string;
	billing_street?: string;
	billing_zip_code?: string;
};

type Props = {
	// optional callback when user taps Create Card
	onCreate?: () => void;
};

export default function DollarCardUI({ onCreate }: Props) {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<DollarCardData | null>(null);
	const [balance, setBalance] = useState<number | null>(null);
	// initial freeze-state fetched from server to drive the icon correctly on first render
	const [initialFrozen, setInitialFrozen] = useState<boolean | null>(null);
	const [showCvv, setShowCvv] = useState(false);
	const [showNumber, setShowNumber] = useState(false);
	const [detailsVisible, setDetailsVisible] = useState(false);
	const [fundModalVisible, setFundModalVisible] = useState(false);
	const [fundAmount, setFundAmount] = useState<string>('');
	const [estimateData, setEstimateData] = useState<any>(null);
	const [isEstimating, setIsEstimating] = useState(false);
	const [showPinSetup, setShowPinSetup] = useState(false);
	const [showPinVerify, setShowPinVerify] = useState(false);
	const [pinProcessing, setPinProcessing] = useState(false);
	const [pendingAction, setPendingAction] = useState<((pin: string) => void | Promise<void>) | null>(null);
	const { userData, setUserData } = useAppStore();

	const { showConfirm, showError, showSuccess, alertState, hideAlert } = useCustomAlert();

	const cardWidth = Math.round(Dimensions.get('window').width * 0.9);

	const colorScheme = useColorScheme();
	const isDark = colorScheme === 'dark';
	const router = useRouter();

	// neutral monochrome palette for dark/light modes
	const neutralLight = '#f3f4f6';
	const neutralDark = '#0f1724';
	const neutralTextLight = '#111827';
	const neutralTextDark = '#e5e7eb';
	const neutralMutedLight = '#6b7280';
	const neutralMutedDark = '#9ca3af';

	const cardBg = isDark ? neutralDark : neutralLight;
	const infoValueColor = isDark ? neutralTextDark : neutralTextLight;
	const infoLabelColor = isDark ? neutralMutedDark : neutralMutedLight;
	const emptyBg = isDark ? '#0b1117' : '#fff';
	const emptyBorder = isDark ? '#1f2937' : '#e5e7eb';
	const emptyTextColor = isDark ? neutralMutedDark : neutralMutedLight;
	const detailsBtnBg = isDark ? '#111827' : '#fff';
	const detailsBtnText = isDark ? neutralTextDark : neutralTextLight;
	const modalBg = isDark ? '#0b1117' : '#fff';
	const modalTextColor = isDark ? neutralTextDark : neutralTextLight;
	const modalBackdropColor = isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)';

		// Colors on the card surface
		const onCardTextColor = isDark ? '#fff' : '#111827';
		const onCardSubtleColor = isDark ? '#e6f0ff' : '#374151';

	// fetchData is exposed so we can trigger it from retry button
	async function fetchData() {
		setLoading(true);
		setError(null);
		try {
			const res = await apiClient.get<DollarCardData>('/dollar-card/details');

			// Support both ApiResponse and direct payload shapes
			if (res && (res as any).success === true && (res as any).data) {
				setData((res as any).data as DollarCardData);
			} else if ((res as any).card_number) {
				setData(res as any as DollarCardData);
			} else {
				setData(null);
			}
		} catch (err: any) {
			setError(err?.message || 'Failed to load card');
		} finally {
			setLoading(false);
		}
	}

	// fetch balance separately
	async function fetchBalance() {
		try {
			const res = await dollarCardService.getBalance();
			if (res && (res as any).success && (res as any).data) {
				setBalance((res as any).data.available_balance ?? null);
			} else if ((res as any).available_balance !== undefined) {
				setBalance((res as any).available_balance ?? null);
			} else {
				setBalance(null);
			}
		} catch (e) {
			setBalance(null);
		}
	}

	useEffect(() => {
		let mounted = true;
		if (mounted) {
			fetchData();
			fetchBalance();
			// Also fetch freeze status immediately so the freeze icon reflects server state from the start
			(async () => {
				try {
					const res = await dollarCardService.getFreezeStatus();
					if (res?.success && res.data) {
						const status = String(res.data.status || '').toLowerCase();
						const frozen = Boolean(res.data.frozen) || (!!status && status !== 'active');
						if (mounted) setInitialFrozen(Boolean(frozen));
					}
				} catch {
					if (mounted) setInitialFrozen(null);
				}
			})();
		}
		return () => {
			mounted = false;
		};
	}, []);

	const maskedNumber = (num?: string) => {
		if (!num) return '•••• •••• •••• ••••';
		const clean = num.replace(/\s+/g, '');
		return clean.replace(/(.{4})/g, '$1 ').trim();
	};

	const maskCardNumber = (num?: string, show?: boolean) => {
		if (!num) return '•••• •••• •••• ••••';
		const clean = num.replace(/\s+/g, '');
		if (show) return clean.replace(/(.{4})/g, '$1 ').trim();
		const last4 = clean.slice(-4).padStart(4, '•');
		return `•••• •••• •••• ${last4}`;
	};

	const ensureTransactionPin = useCallback((): boolean => {
		if (!userData?.hasTransactionPin) {
			setShowPinSetup(true);
			return false;
		}
		return true;
	}, [userData]);

	const requirePinThen = useCallback((action: (pin: string) => void | Promise<void>) => {
		if (!ensureTransactionPin()) return;
		setPendingAction(() => action);
		setShowPinVerify(true);
		}, [ensureTransactionPin]);

	// Format helpers
	const formatNGN = (n: number | string | undefined) => {
		const val = typeof n === 'string' ? parseFloat(n) : (n ?? 0);
		if (!isFinite(val)) return '₦0.00';
		return `₦${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
	};

	const onPressCreate = () => {
		if (onCreate) return onCreate();
		// Default: navigate to create screen (expo-router)
		try {
			router.push('/cards/dollar/create');
			return;
		} catch (e) {
			Alert.alert('Create card', 'No create action provided. Hook up `onCreate` to start card creation.');
		}
	};

	// Debounce quote as user types amount when modal is open
	useEffect(() => {
		if (!fundModalVisible) return;
		const amt = parseFloat(fundAmount);
		if (!amt || amt < 3) {
			setEstimateData(null);
			return;
		}
		setIsEstimating(true);
		const t = setTimeout(async () => {
			try {
				const res = await dollarCardService.quoteFunding(amt);
				if (res.success && res.data) {
					setEstimateData(res.data);
				} else {
					setEstimateData(null);
				}
			} catch (e) {
				setEstimateData(null);
			} finally {
				setIsEstimating(false);
			}
		}, 500);
		return () => clearTimeout(t);
	}, [fundAmount, fundModalVisible]);

	const handleFundCard = async () => {
		const amount = parseFloat(fundAmount);
		if (!amount || amount < 3) {
			showError('Invalid Amount', 'Minimum funding amount is $3.00 USD');
			return;
		}

		// Ensure we have a quote; fetch immediately if missing
		let quote = estimateData;
		if (!quote) {
			try {
				const res = await dollarCardService.quoteFunding(amount);
				if (res.success && res.data) quote = res.data;
			} catch {}
		}

		if (!quote) {
			showError('Quote unavailable', 'Please try again.');
			return;
		}

		setFundModalVisible(false);
		const { exchange_rate, fx_amount_ngn, processing_fee_ngn, total_ngn } = quote;
		showConfirm(
			'Confirm Funding',
			`Fund $${amount} USD?\n\nExchange Rate: ${formatNGN(exchange_rate)}/$1\nFX Amount: ${formatNGN(fx_amount_ngn)}\nProcessing Fee: ${formatNGN(processing_fee_ngn)}\nTotal Deducted: ${formatNGN(total_ngn)}`,
			async () => {
				try {
					const response = await dollarCardService.fund({ amount, mode: 'sandbox' });
					if (response.success) {
						showSuccess('Success', 'Card funding initiated successfully');
						setFundAmount('');
						setEstimateData(null);
						// refresh card details and balance
						fetchData();
						fetchBalance();
					} else {
						showError('Error', response.message || response.error || 'Failed to fund card');
					}
				} catch (error: any) {
					showError('Error', error?.message || 'Failed to fund card');
				}
			},
			() => {
				// Cancel — reopen modal to edit amount
				setFundModalVisible(true);
			}
		);
	};

	const openFundModal = () => {
		setFundModalVisible(true);
	};

	const openWithdrawFlow = () => {
		showError('Withdraw', 'Withdraw functionality coming soon');
	};

	if (loading) {
		return (
			<ThemedView style={styles.container}>
				<FSActivityLoader />
			</ThemedView>
		);
	}

	if (error) {
		return (
			<ThemedView style={styles.container}>
				<ThemedText style={styles.error}>{error}</ThemedText>
				<TouchableOpacity style={styles.button} onPress={() => { fetchData(); }}>
					<Text style={styles.buttonText}>Retry</Text>
				</TouchableOpacity>
			</ThemedView>
		);
	}

	// No card
	if (!data) {
		return (
			<ThemedView style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
				<View style={[styles.emptyCard, styles.emptyCenter, { width: '100%' }]}> 
					<TouchableOpacity
						style={[styles.plusWrap, { backgroundColor: detailsBtnBg }]}
						onPress={onPressCreate}
						activeOpacity={0.85}
						accessibilityRole="button"
						accessibilityLabel="Create Dollar card"
					>
						<Ionicons name="add" size={56} color={isDark ? neutralTextDark : neutralTextLight} />
					</TouchableOpacity>

					<AppButton title="Create Dollar Card" onPress={onPressCreate} variant={isDark ? 'white' : 'dark'} />
				</View>
			</ThemedView>
		);
	}

	// Internal component for the existing card UI
	const DollarCardDetails: React.FC = () => {
		const cardData = data!;
		return (
			<View>
				<View style={[styles.cardContainer, { width: cardWidth, backgroundColor: cardBg }]}> 
					<View style={styles.cardTop}>
						<View>
							<Text style={styles.balanceLabel}>Balance</Text>
							<Text style={styles.balanceValue}>
								{typeof balance === 'number'
									? `$${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
									: typeof cardData.balance === 'number'
									? `$${cardData.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
									: '$0.00'}
							</Text>
						</View>

						<Text style={[styles.brand, { color: onCardTextColor }]}>{cardData.card_brand || cardData.card_type || 'USD'}</Text>
					</View>

					<View style={styles.cardMiddle}>
						<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
							<Text style={[styles.cardNumber, { color: onCardTextColor }]}>{maskCardNumber(cardData.card_number, showNumber)}</Text>
							<TouchableOpacity
								onPress={() => requirePinThen(() => setShowNumber((s) => !s))}
								accessibilityRole="button"
								accessibilityLabel={showNumber ? 'Hide card number' : 'Show card number'}
								hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
							>
								<Ionicons name={showNumber ? 'eye-off' : 'eye'} size={18} color={onCardTextColor} />
							</TouchableOpacity>
						</View>
					</View>

					<View style={styles.cardBottom}>
						<View>
							<Text style={[styles.smallLabel, { color: onCardSubtleColor }]}>Cardholder</Text>
							<Text style={[styles.value, { color: onCardTextColor }]}>{cardData.card_holder_name || '—'}</Text>
						</View>

						<View>
							<Text style={[styles.smallLabel, { color: onCardSubtleColor }]}>Expires</Text>
							<Text style={[styles.value, { color: onCardTextColor }]}>{cardData.expiry || '--/--'}</Text>
						</View>

						<View>
							<Text style={[styles.smallLabel, { color: onCardSubtleColor }]}>CVV</Text>
							<TouchableOpacity onPress={() => requirePinThen(() => setShowCvv((s) => !s))}>
								<Text style={[styles.value, { color: onCardTextColor }]}>{showCvv ? cardData.cvv ?? (cardData as any).default_pin ?? '•••' : '•••'}</Text>
							</TouchableOpacity>
						</View>
					</View>

					<View style={styles.cardActions}>
						<TouchableOpacity style={[styles.detailsButton, { backgroundColor: detailsBtnBg }]} onPress={() => requirePinThen((_pin) => setDetailsVisible(true))}>
							<Text style={[styles.detailsButtonText, { color: detailsBtnText }]}>Details</Text>
						</TouchableOpacity>
					</View>
				</View>

				{/* Details modal */}
				<Modal visible={detailsVisible} animationType="slide" transparent={true} onRequestClose={() => setDetailsVisible(false)}>
					<View style={[styles.modalBackdrop, { backgroundColor: modalBackdropColor }]}> 
						<View style={[styles.modalContainer, { backgroundColor: modalBg }]}> 
							<ScrollView contentContainerStyle={{ padding: 16 }}>
								<Text style={[styles.modalTitle, { color: modalTextColor }]}>Card details</Text>

								<Text style={[styles.infoLabel, { color: infoLabelColor }]}>Email</Text>
								<Text style={[styles.infoValue, { color: infoValueColor }]}>{cardData.customer_email || '—'}</Text>

								  <Text style={[styles.infoLabel, { color: infoLabelColor }]}>Phone</Text>
								  <Text style={[styles.infoValue, { color: infoValueColor }]}>—</Text>

												<Text style={[styles.infoLabel, { color: infoLabelColor }]}>Billing address</Text>
												<Text style={[styles.infoValue, { color: infoValueColor }]}>
													{(() => {
														const parts = [cardData.billing_street, cardData.billing_city, cardData.billing_country, cardData.billing_zip_code].filter(Boolean);
														return parts.length ? parts.join(', ') : '—';
													})()}
												</Text>

								<Pressable style={[styles.closeButton, { backgroundColor: detailsBtnBg }]} onPress={() => setDetailsVisible(false)}>
									<Text style={styles.closeButtonText}>Close</Text>
								</Pressable>
							</ScrollView>
						</View>
					</View>
				</Modal>
			</View>
		);
	};

	// Card exists — render details via internal component
	return (
		<ThemedView style={styles.container}>
			<View style={styles.cardSection}>
				<DollarCardDetails />
				<CardActionsContainer 
					defaultFrozen={
						initialFrozen !== null
							? initialFrozen
							: (data?.card_status === 'frozen' || data?.card_status === 'inactive')
					}
					onFundRequested={openFundModal}
					onWithdrawRequested={openWithdrawFlow}
				/>
						<View style={{ flex: 1, marginTop: 12 }}>
							<DollarCardTransactions />
						</View>
			</View>

			{/* Fund Modal */}
			<Modal visible={fundModalVisible} animationType="slide" transparent={true} onRequestClose={() => setFundModalVisible(false)}>
				<View style={[styles.modalBackdrop, { backgroundColor: modalBackdropColor }]}>
					<View style={[styles.modalContainer, { backgroundColor: modalBg }]}>
						<ScrollView contentContainerStyle={{ padding: 16 }}>
							<Text style={[styles.modalTitle, { color: modalTextColor }]}>Fund Card</Text>
							
							<Text style={[styles.infoLabel, { color: infoLabelColor }]}>Amount (USD)</Text>
							<TextInput
								style={[styles.input, { color: modalTextColor, borderColor: infoLabelColor }]}
								value={fundAmount}
								onChangeText={setFundAmount}
								placeholder="Minimum $3.00"
								placeholderTextColor={infoLabelColor}
								keyboardType="decimal-pad"
								autoFocus
							/>
							
							<Text style={[styles.helperText, { color: infoLabelColor }]}>
								Minimum funding amount is $3.00 USD
							</Text>

							{/* Quote details */}
							{(() => {
								const amt = parseFloat(fundAmount);
								const valid = !!amt && amt >= 3;
								if (!valid) return null;
								if (isEstimating && !estimateData) {
									return <Text style={[styles.helperText, { color: infoLabelColor }]}>Getting quote…</Text>;
								}
								if (estimateData) {
									const { exchange_rate, fx_amount_ngn, processing_fee_ngn, total_ngn } = estimateData;
									return (
										<View style={[styles.quoteBox, { borderColor: infoLabelColor }]}> 
											<View style={styles.quoteRow}>
												<Text style={[styles.quoteLabel, { color: infoLabelColor }]}>Exchange Rate</Text>
												<Text style={[styles.quoteValue, { color: modalTextColor }]}>{formatNGN(exchange_rate)}/$1</Text>
											</View>
											<View style={styles.quoteRow}>
												<Text style={[styles.quoteLabel, { color: infoLabelColor }]}>FX Amount (NGN)</Text>
												<Text style={[styles.quoteValue, { color: modalTextColor }]}>{formatNGN(fx_amount_ngn)}</Text>
											</View>
											<View style={styles.quoteRow}>
												<Text style={[styles.quoteLabel, { color: infoLabelColor }]}>Processing Fee</Text>
												<Text style={[styles.quoteValue, { color: modalTextColor }]}>{formatNGN(processing_fee_ngn)}</Text>
											</View>
											<View style={[styles.quoteRow, styles.quoteTotalRow]}>
												<Text style={[styles.quoteLabel, styles.quoteTotalLabel, { color: infoLabelColor }]}>Total Deducted</Text>
												<Text style={[styles.quoteValue, styles.quoteTotalValue, { color: modalTextColor }]}>{formatNGN(total_ngn)}</Text>
											</View>
										</View>
									);
								}
								return null;
							})()}

							<View style={styles.modalActions}>
								<Pressable 
									style={[styles.modalButton, styles.cancelButton, { borderColor: infoLabelColor }]} 
									onPress={() => {
										setFundModalVisible(false);
										setFundAmount('');
									}}
								>
									<Text style={[styles.cancelButtonText, { color: infoLabelColor }]}>Cancel</Text>
								</Pressable>
								
								<Pressable 
									style={[styles.modalButton, styles.confirmButton, { backgroundColor: detailsBtnBg, opacity: (isEstimating || parseFloat(fundAmount || '0') < 3) ? 0.7 : 1 }]} 
									onPress={handleFundCard}
									disabled={isEstimating || parseFloat(fundAmount || '0') < 3}
								>
									<Text style={[styles.confirmButtonText, { color: detailsBtnText }]}>
										{isEstimating ? 'Getting Quote…' : 'Continue'}
									</Text>
								</Pressable>
							</View>
						</ScrollView>
					</View>
				</View>
			</Modal>

			{/* Custom Alert Modal */}
			<CustomAlert
				visible={alertState.visible}
				title={alertState.title}
				message={alertState.message}
				buttons={alertState.buttons}
				icon={alertState.icon}
				iconColor={alertState.iconColor}
				onRequestClose={hideAlert}
			/>

			{/* Transaction PIN Setup Modal */}
			<TransactionPinSetupModal
				visible={showPinSetup}
				onSuccess={() => {
					if (userData) setUserData({ ...userData, hasTransactionPin: true });
				}}
				onClose={() => setShowPinSetup(false)}
			/>

			{/* PIN Verify Modal */}
			<TransactionPinModal
				visible={showPinVerify}
				isProcessing={pinProcessing}
				onClose={() => {
					if (!pinProcessing) {
						setShowPinVerify(false);
						setPendingAction(null);
					}
				}}
				onPinEntered={async (pin) => {
					setPinProcessing(true);
					try {
						const toRun = pendingAction;
						setPendingAction(null);
						setShowPinVerify(false);
						await toRun?.(pin);
					} finally {
						setPinProcessing(false);
					}
				}}
			/>
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		width: '100%'
	},
	cardDetailsContainer: {
		width: '100%'
	},
	cardSection: {
		width: '100%',
		alignSelf: 'flex-start',
		flex: 1
	},
	error: {
		color: 'red',
		marginBottom: 12,
	},
	button: {
		padding: 10,
		backgroundColor: '#eee',
		borderRadius: 8,
	},
	buttonText: {
		color: '#333',
	},
	emptyCard: {
		padding: 20,
		borderRadius: 12,
		alignItems: 'center',
	},
	emptyTitle: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 8,
	},
	emptyText: {
		fontSize: 13,
		color: '#666',
		textAlign: 'center',
		marginBottom: 16,
	},
	emptyCenter: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	plusWrap: {
		width: 96,
		height: 96,
		borderRadius: 48,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 12,
		elevation: 4,
	},
	createButton: {
		marginTop: 8,
		width: '80%',
	},
	primaryButton: {
		backgroundColor: '#0a84ff',
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 8,
	},
	primaryButtonText: {
		color: '#fff',
		fontWeight: '600',
	},
	cardContainer: {
		backgroundColor: '#0b5cff',
		borderRadius: 12,
		padding: 18,
		marginBottom: 16,
	},
	cardTop: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	brand: {
		color: '#fff',
		fontWeight: '700',
	},
	balanceLabel: {
		color: '#e6f0ff',
		fontSize: 11,
		marginBottom: 2,
	},
	balanceValue: {
		color: '#fff',
		fontWeight: '700',
		fontSize: 18,
	},
	cardMiddle: {
		marginTop: 24,
	},
	cardNumber: {
		color: '#fff',
		fontSize: 18,
		letterSpacing: 2,
		fontWeight: '600',
	},
	cardBottom: {
		marginTop: 18,
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	smallLabel: {
		color: '#e6f0ff',
		fontSize: 11,
	},
	value: {
		color: '#fff',
		fontWeight: '600',
		marginTop: 4,
	},
	infoBox: {
		padding: 12,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: '#eee',
	},
	infoLabel: {
		fontSize: 12,
		color: '#666',
		marginTop: 8,
	},
	infoValue: {
		fontSize: 14,
		color: '#222',
		fontWeight: '500',
	},
	cardActions: {
		marginTop: 12,
		alignItems: 'flex-end',
	},
	detailsButton: {
		backgroundColor: '#fff',
		paddingVertical: 8,
		paddingHorizontal: 14,
		borderRadius: 8,
	},
	detailsButtonText: {
		color: '#0b5cff',
		fontWeight: '600',
	},
	modalBackdrop: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContainer: {
		width: '90%',
		maxHeight: '80%',
		backgroundColor: '#fff',
		borderRadius: 12,
		overflow: 'hidden',
	},
	modalTitle: {
		fontSize: 16,
		fontWeight: '700',
		marginBottom: 12,
	},
	closeButton: {
		marginTop: 16,
		backgroundColor: '#0a84ff',
		paddingVertical: 12,
		borderRadius: 8,
		alignItems: 'center',
	},
	closeButtonText: {
		color: '#fff',
		fontWeight: '600',
	},
	input: {
		borderWidth: 1,
		borderRadius: 8,
		padding: 12,
		fontSize: 16,
		marginTop: 4,
		marginBottom: 8,
	},
	helperText: {
		fontSize: 12,
		marginBottom: 16,
	},
	modalActions: {
		flexDirection: 'row',
		gap: 12,
		marginTop: 8,
	},
	modalButton: {
		flex: 1,
		paddingVertical: 12,
		borderRadius: 8,
		alignItems: 'center',
	},
	cancelButton: {
		borderWidth: 1,
	},
	cancelButtonText: {
		fontWeight: '600',
	},
	confirmButton: {
		backgroundColor: '#0a84ff',
	},
	confirmButtonText: {
		color: '#fff',
		fontWeight: '600',
	},
	quoteBox: {
		borderWidth: 1,
		borderRadius: 8,
		padding: 12,
		marginTop: 8,
	},
	quoteRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 6,
	},
	quoteLabel: {
		fontSize: 13,
	},
	quoteValue: {
		fontSize: 13,
		fontWeight: '600',
	},
	quoteTotalRow: {
		marginTop: 4,
		paddingTop: 8,
		borderTopWidth: 1,
		borderColor: '#e5e7eb',
	},
	quoteTotalLabel: {
		fontSize: 14,
		fontWeight: '700',
	},
	quoteTotalValue: {
		fontSize: 14,
		fontWeight: '700',
	},
});

