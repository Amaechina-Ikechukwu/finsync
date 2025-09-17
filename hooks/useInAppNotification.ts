import { InAppNotificationType } from '@/components/InAppNotification';
import { useCallback, useState } from 'react';

export function useInAppNotification() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<InAppNotificationType>('info');

  const showNotification = useCallback((msg: string, t: InAppNotificationType = 'info') => {
    // Clear any existing message first
    setVisible(false);
    setMessage('');
    
    // Small delay to ensure clean state before showing new notification
    setTimeout(() => {
      setMessage(msg);
      setType(t);
      setVisible(true);
    }, 50);
  }, []);

  const hideNotification = useCallback(() => {
    setVisible(false);
    // Clear the message after animation completes
    setTimeout(() => {
      setMessage('');
    }, 400); // Match the animation duration
  }, []);

  const clearNotification = useCallback(() => {
    setVisible(false);
    setMessage('');
  }, []);

  return {
    visible,
    message,
    type,
    showNotification,
    hideNotification,
    clearNotification,
  };
}
