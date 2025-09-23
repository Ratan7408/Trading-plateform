import { useState, useCallback } from 'react';

export default function usePayout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const API_BASE = 'http://localhost:5000';

  const requestPayout = useCallback(async ({ transferId, amount, bankCode, receiveName, receiveAccount, remark }) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');

      const res = await fetch(`${API_BASE}/api/payouts/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ transferId, amount, bankCode, receiveName, receiveAccount, remark }),
      });

      const data = await res.json();
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

      const token = localStorage.getItem('token');

      const res = await fetch(`${API_BASE}/api/payouts/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ transferId }),
      });

      const data = await res.json();
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

      const token = localStorage.getItem('token');

      const res = await fetch(`${API_BASE}/api/payouts/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
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


