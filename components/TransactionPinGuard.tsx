import { useNotification } from '@/components/InAppNotificationProvider';
import TransactionPinSetupModal from '@/components/TransactionPinSetupModal';
import { useAppStore } from '@/store';
import React, { useEffect, useState } from 'react';

interface TransactionPinGuardProps {
    children: React.ReactNode;
}

export default function TransactionPinGuard({ children }: TransactionPinGuardProps) {
    const { userData, setUserData } = useAppStore();
    const { showNotification } = useNotification();
    const [showPinSetup, setShowPinSetup] = useState(false);
    const [isSettingPin, setIsSettingPin] = useState(false);

    useEffect(() => {
        // Check if user has transaction PIN set
        if (userData && !userData.hasTransactionPin) {
            setShowPinSetup(true);
        }
    }, [userData]);

    const handlePinSet = async (pin: string) => {
        setIsSettingPin(true);
        try {
            // Here you would call your API to set the transaction PIN
            // For now, we'll simulate the API call
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Update user data to reflect that PIN is now set
            if (userData) {
                setUserData({
                    ...userData,
                    hasTransactionPin: true
                });
            }
            
            setShowPinSetup(false);
            showNotification('Transaction PIN set successfully!', 'success');
        } catch (error) {
            console.error('Error setting transaction PIN:', error);
            showNotification('Failed to set transaction PIN. Please try again.', 'error');
        } finally {
            setIsSettingPin(false);
        }
    };

    const handlePinSetSuccess = () => {
        // Update user data to reflect that PIN is now set
        if (userData) {
            setUserData({
                ...userData,
                hasTransactionPin: true
            });
        }
    };

    const handleCloseModal = () => {
        setShowPinSetup(false);
    };

    return (
        <>
            {children}
            
            {/* Transaction PIN Setup Modal - Non-closable */}
            <TransactionPinSetupModal
                visible={showPinSetup}
                onPinSet={handlePinSet}
                onSuccess={handlePinSetSuccess}
                onClose={handleCloseModal}
            />
        </>
    );
}
