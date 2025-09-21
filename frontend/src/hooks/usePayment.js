import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

/**
 * Payment Hook
 * Handles all payment operations for the trading platform
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
   * Create payment order
   */
  const createPayment = useCallback(async (paymentData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/payments/test/create', paymentData);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        throw new Error(response.data.error || 'Payment creation failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Payment creation failed';
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
   * Query payment status
   */
  const queryPaymentStatus = useCallback(async (orderId) => {
    setLoading(true);
    setError(null);

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
      const errorMessage = err.response?.data?.error || err.message || 'Payment query failed';
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
    setLoading(true);
    setError(null);

    try {
      const queryParams = gateway ? `?gateway=${gateway}` : '';
      const response = await api.get(`/payments/methods${queryParams}`);
      
      if (response.data.success) {
        setPaymentMethods(response.data.data.methods);
        setSupportedBanks(response.data.data.banks);
        
        return {
          success: true,
          data: response.data.data
        };
      } else {
        throw new Error(response.data.error || 'Failed to fetch payment methods');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch payment methods';
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
   * Poll payment status until completion
   */
  const pollPaymentStatus = useCallback((orderId, onStatusChange, maxAttempts = 30, interval = 5000) => {
    let attempts = 0;
    
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
        const status = result.data.status;
        onStatusChange(result);
        
        // Stop polling if payment is completed, failed, or cancelled
        if (['completed', 'failed', 'cancelled', 'expired'].includes(status)) {
          return;
        }
      }
      
      // Continue polling
      setTimeout(poll, interval);
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
  }, []);

  /**
   * Format currency amount
   */
  const formatAmount = useCallback((amount, currency = 'INR') => {
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });

    return formatter.format(amount);
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
    supportedBanks,
    
    // Actions
    createPayment,
    queryPaymentStatus,
    getPaymentHistory,
    createPayout,
    getPaymentMethods,
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
