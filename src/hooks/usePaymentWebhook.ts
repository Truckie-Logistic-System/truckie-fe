import { useState, useCallback } from 'react';
import { transactionService } from '@/services/transaction';

/**
 * Hook để quản lý payment webhook operations
 */
export const usePaymentWebhook = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [webhookCalled, setWebhookCalled] = useState(false);

  const callPayOSWebhook = useCallback(async (orderCode: number, status: string) => {
    if (webhookCalled) {
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await transactionService.callPayOSWebhook(orderCode, status);
      setWebhookCalled(true);

      if (response.data?.success) {
      }

      return response.data;
    } catch (err: any) {
      console.error('[usePaymentWebhook] ❌ Error calling webhook:', err);
      setError(err?.message || 'Webhook call failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [webhookCalled]);

  const resetWebhookState = useCallback(() => {
    setWebhookCalled(false);
    setError(null);
  }, []);

  return {
    loading,
    error,
    webhookCalled,
    callPayOSWebhook,
    resetWebhookState,
  };
};
