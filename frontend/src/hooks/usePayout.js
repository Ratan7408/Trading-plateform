import { useState, useCallback } from 'react';
import api from '../utils/api';

export default function usePayout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Use shared axios instance configured with VPS base URL

  const requestPayout = useCallback(async ({ transferId, amount, bankCode, receiveName, receiveAccount, remark }) => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.post('/payouts/create', { transferId, amount, bankCode, receiveName, receiveAccount, remark });
      const data = res.data;
      setResult(data);

      if (!data.success) throw new Error(data.error || 'Payout failed');
    } catch (err) {
      console.error('❌ Payout request failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const queryPayout = useCallback(async (transferId) => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.post('/payouts/query', { transferId });
      const data = res.data;
      setResult(data);

      if (!data.success) throw new Error(data.error || 'Payout query failed');
    } catch (err) {
      console.error('❌ Payout query failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const queryBalance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.post('/payouts/balance');
      const data = res.data;
      setResult(data);

      if (!data.success) throw new Error(data.error || 'Balance query failed');
    } catch (err) {
      console.error('❌ Balance query failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, result, requestPayout, queryPayout, queryBalance };
}


