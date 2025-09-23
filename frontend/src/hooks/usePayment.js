import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

/**
 * Payment Hook - Updated with better error handling
 */
export const usePayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [supportedBanks, setSupportedBanks] = useState([]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  /**
   * Create payment order - Locked down version
   */
  const createPayment = useCallback(async (paymentData) => {
    setLoading(true);
    setError(null);

    try {
      // Force correct types and required fields
      const payload = {
        amount: Number(paymentData.amount), // ensure number
        currency: 'INR',
        subject: paymentData.subject || 'Trading Platform Recharge',
        description: paymentData.description || `Recharge for ₹${paymentData.amount}`,
        paymentMethod: paymentData.paymentMethod || 'upi',
        // Only include bankCode if provided (required for bank_transfer only)
        ...(paymentData.bankCode ? { bankCode: paymentData.bankCode } : {}),
        // Use WatchGLB as active gateway per new configuration
        gateway: 'watchglb'
      };

      const response = await api.post('/payments/create', payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`, // add JWT
        },
      });
      const body = response.data;
      // Clean router returns raw WatchGLB response
      if (body && body.respCode === 'SUCCESS' && body.tradeResult === '1' && body.payInfo) {
        try { window.location.href = body.payInfo; } catch {}
        return { success: true, url: body.payInfo };
      }
      // Legacy controller shape
      if (body && body.success && body.data?.paymentUrl) {
        try { window.location.href = body.data.paymentUrl; } catch {}
        return { success: true, url: body.data.paymentUrl };
      }
      throw new Error(body?.error || body?.tradeMsg || body?.errorMsg || 'Payment creation failed');
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Payment creation failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Query payment status with better error handling
   */
  const queryPaymentStatus = useCallback(async (orderId) => {
    try {
      const response = await api.get(`/payments/${orderId}/status`);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        throw new Error(response.data.error || 'Payment query failed');
      }
    } catch (err) {
      // Don't set global error for status queries as they might be polling
      console.warn('Payment status query failed:', err.message);
      
      return {
        success: false,
        error: err.response?.data?.error || err.message || 'Payment query failed',
        isNetworkError: err.code === 'NETWORK_ERROR' || err.response?.status >= 500
      };
    }
  }, []);

  /**
   * Get payment history
   */
  const getPaymentHistory = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await api.get(`/payments/history?${queryParams}`);
      
      if (response.data.success) {
        setPaymentHistory(response.data.data.transactions);
        return {
          success: true,
          data: response.data.data
        };
      } else {
        throw new Error(response.data.error || 'Failed to fetch payment history');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch payment history';
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create payout request
   */
  const createPayout = useCallback(async (payoutData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/payments/payout', payoutData);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        throw new Error(response.data.error || 'Payout creation failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Payout creation failed';
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get supported payment methods
   */
  const getPaymentMethods = useCallback(async (gateway = null) => {
    try {
      const queryParams = gateway ? `?gateway=${gateway}` : '';
      const response = await api.get(`/payments/methods${queryParams}`);
      const body = response.data;
      // Clean router returns array
      if (Array.isArray(body)) {
        setPaymentMethods(body);
        setSupportedBanks([]);
        return { success: true, data: { methods: body, banks: [] } };
      }
      // Legacy controller shape
      if (body?.success && body.data?.methods) {
        setPaymentMethods(body.data.methods);
        setSupportedBanks(body.data.banks || []);
        return { success: true, data: body.data };
      }
      throw new Error(body?.error || 'Failed to fetch payment methods');
    } catch (err) {
      console.warn('Failed to fetch payment methods:', err.message);
      
      // Set default methods if API fails
      const defaultMethods = [
        { method: 'upi', label: 'India UPI' },
        { method: 'paytm', label: 'India Paytm' },
        { method: 'usdt', label: 'USDT (Crypto)' },
        { method: 'pix', label: 'Brazil PIX' },
        { method: 'momo', label: 'Vietnam MOMO' }
      ];
      
      const defaultBanks = [
        { code: 'SBI', name: 'State Bank of India' },
        { code: 'HDFC', name: 'HDFC Bank' },
        { code: 'ICICI', name: 'ICICI Bank' }
      ];
      
      setPaymentMethods(defaultMethods);
      setSupportedBanks(defaultBanks);
      
      return {
        success: false,
        error: err.message,
        fallbackData: {
          methods: defaultMethods,
          banks: defaultBanks
        }
      };
    }
  }, []);

  // Simple alias matching example usage
  const fetchMethods = useCallback(async () => {
    await getPaymentMethods('watchglb');
  }, [getPaymentMethods]);

  /**
   * Poll payment status until completion with improved error handling
   */
  const pollPaymentStatus = useCallback((orderId, onStatusChange, maxAttempts = 30, interval = 5000) => {
    let attempts = 0;
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 3;
    
    const poll = async () => {
      if (attempts >= maxAttempts) {
        onStatusChange({
          success: false,
          error: 'Payment status polling timeout'
        });
        return;
      }

      attempts++;
      const result = await queryPaymentStatus(orderId);
      
      if (result.success) {
        consecutiveErrors = 0; // Reset error counter on success
        const status = result.data.status;
        onStatusChange(result);
        
        // Stop polling if payment is completed, failed, or cancelled
        if (['completed', 'failed', 'cancelled', 'expired'].includes(status)) {
          return;
        }
      } else {
        consecutiveErrors++;
        
        // If we have too many consecutive errors, stop polling
        if (consecutiveErrors >= maxConsecutiveErrors) {
          onStatusChange({
            success: false,
            error: 'Multiple consecutive errors during status polling'
          });
          return;
        }
        
        // For network errors, continue polling but log the issue
        if (result.isNetworkError) {
          console.warn(`Network error during polling attempt ${attempts}, continuing...`);
        }
      }
      
      // Continue polling with exponential backoff on errors
      const nextInterval = consecutiveErrors > 0 ? interval * Math.pow(2, consecutiveErrors) : interval;
      setTimeout(poll, Math.min(nextInterval, 30000)); // Max 30 second interval
    };

    poll();
  }, [queryPaymentStatus]);

  /**
   * Open payment URL in new window/tab
   */
  const openPaymentWindow = useCallback((paymentUrl, orderId) => {
    if (!paymentUrl) {
      setError('Payment URL not available');
      return null;
    }

    try {
      const paymentWindow = window.open(
        paymentUrl,
        `payment_${orderId}`,
        'width=800,height=600,scrollbars=yes,resizable=yes'
      );

      if (!paymentWindow) {
        setError('Please allow popups for payment processing');
        return null;
      }

      return paymentWindow;
    } catch {
      setError('Failed to open payment window');
      return null;
    }
  }, []);

  /**
   * Format currency amount
   */
  const formatAmount = useCallback((amount, currency = 'INR') => {
    try {
      const formatter = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });

      return formatter.format(amount);
    } catch {
      // Fallback formatting
      return `₹${parseFloat(amount).toFixed(2)}`;
    }
  }, []);

  /**
   * Get payment status badge color
   */
  const getStatusColor = useCallback((status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      expired: 'bg-orange-100 text-orange-800'
    };

    return colors[status] || 'bg-gray-100 text-gray-800';
  }, []);

  /**
   * Validate payment form data
   */
  const validatePaymentData = useCallback((data) => {
    const errors = {};

    if (!data.amount || data.amount < 100) {
      errors.amount = 'Minimum payment amount is ₹100';
    }

    if (data.amount && data.amount > 500000) {
      errors.amount = 'Maximum payment amount is ₹500,000';
    }

    if (!data.paymentMethod) {
      errors.paymentMethod = 'Please select a payment method';
    }

    if (data.paymentMethod === 'bank_transfer' && !data.bankCode) {
      errors.bankCode = 'Please select a bank';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }, []);

  /**
   * Validate payout form data
   */
  const validatePayoutData = useCallback((data) => {
    const errors = {};

    if (!data.amount || data.amount < 500) {
      errors.amount = 'Minimum payout amount is ₹500';
    }

    if (data.amount && data.amount > 100000) {
      errors.amount = 'Maximum payout amount is ₹100,000';
    }

    if (!data.accountName || data.accountName.length < 2) {
      errors.accountName = 'Account name is required (minimum 2 characters)';
    }

    if (!data.accountNumber || data.accountNumber.length < 9) {
      errors.accountNumber = 'Valid account number is required (minimum 9 digits)';
    }

    if (!data.ifscCode || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(data.ifscCode)) {
      errors.ifscCode = 'Valid IFSC code is required (e.g., SBIN0001234)';
    }

    if (data.mobile && !/^[6-9]\d{9}$/.test(data.mobile)) {
      errors.mobile = 'Valid mobile number is required';
    }

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Valid email address is required';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }, []);

  return {
    // State
    loading,
    error,
    paymentHistory,
    paymentMethods,
    // alias for simpler consumers
    methods: paymentMethods,
    supportedBanks,
    
    // Actions
    createPayment,
    queryPaymentStatus,
    getPaymentHistory,
    createPayout,
    getPaymentMethods,
    fetchMethods,
    pollPaymentStatus,
    openPaymentWindow,
    
    // Utilities
    formatAmount,
    getStatusColor,
    validatePaymentData,
    validatePayoutData,
    
    // Clear functions
    clearError: () => setError(null)
  };
};

export default usePayment;