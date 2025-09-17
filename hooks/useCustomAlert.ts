import { useCallback, useState } from 'react';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
  title: string;
  message?: string;
  buttons: AlertButton[];
  icon?: 'add' | 'xmark.circle.fill' | 'security' | 'person.circle' | 'receipt';
  iconColor?: string;
}

interface AlertState extends AlertOptions {
  visible: boolean;
}

export function useCustomAlert() {
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  const showAlert = useCallback((options: AlertOptions) => {
    setAlertState({
      ...options,
      visible: true,
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState(prev => ({
      ...prev,
      visible: false,
    }));
  }, []);

  // Convenience methods for common alert types
  const showConfirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    showAlert({
      title,
      message,
      icon: 'security',
      buttons: [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: onCancel,
        },
        {
          text: 'Confirm',
          style: 'default',
          onPress: onConfirm,
        },
      ],
    });
  }, [showAlert]);

  const showSuccess = useCallback((title: string, message?: string, onOk?: () => void) => {
    showAlert({
      title,
      message,
      icon: 'add',
      iconColor: '#00A651',
      buttons: [
        {
          text: 'OK',
          style: 'default',
          onPress: onOk,
        },
      ],
    });
  }, [showAlert]);

  const showError = useCallback((title: string, message?: string, onOk?: () => void) => {
    showAlert({
      title,
      message,
      icon: 'xmark.circle.fill',
      iconColor: '#E60012',
      buttons: [
        {
          text: 'OK',
          style: 'destructive',
          onPress: onOk,
        },
      ],
    });
  }, [showAlert]);

  return {
    alertState,
    showAlert,
    hideAlert,
    showConfirm,
    showSuccess,
    showError,
  };
}
