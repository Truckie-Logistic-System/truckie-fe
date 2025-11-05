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
      console.log('[usePaymentWebhook] Webhook already called, skipping');
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('[usePaymentWebhook] Calling PayOS webhook:', { orderCode, status });
      
      const response = await transactionService.callPayOSWebhook(orderCode, status);

      console.log('[usePaymentWebhook] Webhook response:', response.data);
      setWebhookCalled(true);

      if (response.data?.success) {
        console.log('[usePaymentWebhook] ✅ Webhook called successfully');
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
