import TransactionPinModal from '@/components/TransactionPinModal';
import TransactionPinSetupModal from '@/components/TransactionPinSetupModal';
import CustomAlert from '@/components/ui/CustomAlert';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { dollarCardService } from '@/services/apiService';
import { useAppStore } from '@/store';
import React, { useCallback, useEffect, useState } from 'react';
import CardActions from './CardActions';

type Props = {
  defaultFrozen?: boolean;
  onFundRequested?: () => void; // open amount modal elsewhere
  onWithdrawRequested?: () => void; // open withdraw flow
};

export default function CardActionsContainer({
  defaultFrozen = false,
  onFundRequested,
  onWithdrawRequested,
}: Props) {
  const [isFrozen, setIsFrozen] = useState<boolean>(defaultFrozen);
  const [initLoading, setInitLoading] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const [showPinSetup, setShowPinSetup] = useState<boolean>(false);
  const [showPinVerify, setShowPinVerify] = useState<boolean>(false);
  const [pinProcessing, setPinProcessing] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<((pin: string) => void | Promise<void>) | null>(null);
  const { userData, setUserData } = useAppStore();
  const { alertState, hideAlert, showConfirm, showError, showSuccess } = useCustomAlert();

  const refreshFreezeStatus = useCallback(async () => {
    setInitLoading(true);
    try {
      const res = await dollarCardService.getFreezeStatus();
      if (res.success && res.data) {
 
        const status = String(res.data.status || '').toLowerCase();
        const frozen = Boolean(res.data.frozen) || (!!status && status !== 'active');
        setIsFrozen(Boolean(frozen));
      }
    } catch (_) {
      // Silent; user can still interact. Optionally surface an error.
    } finally {
      setInitLoading(false);
    }
  }, []);

  useEffect(() => {
  
  }, [isFrozen]);

  useEffect(() => {
    // Initialize from server freeze-status to ensure correctness
    refreshFreezeStatus();
  }, [refreshFreezeStatus]);

  // Small helper to ensure transaction PIN exists before sensitive actions
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

  const handleToggleFreeze = () => {
    if (!ensureTransactionPin()) return;
    const nextLabel = !isFrozen; // tentative, actual action will be determined from server status
    showConfirm(
      nextLabel ? 'Freeze card?' : 'Unfreeze card?',
      nextLabel ? 'You can unfreeze anytime.' : 'Card will become active again.',
      async () => {
        if (busy) return;
        setBusy(true);
        try {
          // Get latest server status first to decide the intended action
          let desired: boolean = !isFrozen;
          try {
            const cur = await dollarCardService.getFreezeStatus();
            if (cur?.success && cur.data) {
              const status = String(cur.data.status || '').toLowerCase();
              const frozenNow = Boolean(cur.data.frozen) || (!!status && status !== 'active');
              desired = !Boolean(frozenNow);
            }
          } catch {}

          // Apply desired action on server
          const res = await dollarCardService.toggleFreeze(desired);
          if (res.success) {
            // Always re-check from server and set UI from that
            const check = await dollarCardService.getFreezeStatus();
            if (check.success && check.data) {
          
              const status = String(check.data.status || '').toLowerCase();
              const frozen = Boolean(check.data.frozen) || (!!status && status !== 'active');
              setIsFrozen(Boolean(frozen));
            } else {
              // Fallback to desired if status endpoint fails
              setIsFrozen(desired);
            }
            showSuccess(desired ? 'Card frozen' : 'Card unfrozen');
          } else {
            showError('Action failed', (res as any).error || (res as any).message || 'Please try again.');
          }
        } catch (e: any) {
          showError('Action failed', e?.message || 'Please try again.');
        } finally {
          setBusy(false);
        }
      }
    );
  };

  return (
    <>
      <CardActions
        isFrozen={isFrozen}
        onToggleFreeze={() => {
          if (busy || initLoading) return; // guard while loading or in-flight
          requirePinThen(() => handleToggleFreeze());
        }}
        onFund={() => {
          requirePinThen(() => onFundRequested?.());
        }}
        onWithdraw={() => {
          requirePinThen(() => onWithdrawRequested?.());
        }}
      />
      {/* Transaction PIN Setup Modal */}
      <TransactionPinSetupModal
        visible={showPinSetup}
        onSuccess={() => {
          if (userData) {
            setUserData({ ...userData, hasTransactionPin: true });
          }
        }}
        onClose={() => setShowPinSetup(false)}
      />

      
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
    </>
  );
}
