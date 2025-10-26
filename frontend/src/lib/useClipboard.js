import { useCallback } from 'react';
import { copyTextToClipboard, isClipboardSupported } from './clipboard.js';
import { useToast } from '../components/ui/ToastProvider.jsx';

export function useClipboard(defaultMessages = {}) {
  const { pushToast } = useToast();

  const copy = useCallback(async (value, overrides = {}) => {
    const successMessage = overrides.successMessage || defaultMessages.successMessage || 'Copied to clipboard';
    const errorMessage = overrides.errorMessage || defaultMessages.errorMessage || 'Could not copy. Please try again.';
    const result = await copyTextToClipboard(value);
    if (result.ok) {
      pushToast({ message: successMessage, tone: 'success' });
      return true;
    }
    pushToast({ message: errorMessage, tone: 'error' });
    if (result.error) {
      console.warn('Copy failed', result.error);
    }
    return false;
  }, [defaultMessages.errorMessage, defaultMessages.successMessage, pushToast]);

  return {
    copy,
    isSupported: isClipboardSupported()
  };
}
