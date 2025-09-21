import { useState, useEffect } from 'react';
import { usePayment } from '../hooks/usePayment';

/**
 * Payment Modal Component
 * Handles payment creation and processing
 */

const PaymentModal = ({ isOpen, onClose, onSuccess }) => {
  const {
    loading,
    error,
    paymentMethods,
    supportedBanks,
    createPayment,
    getPaymentMethods,
    pollPaymentStatus,
    openPaymentWindow,
    formatAmount,
    validatePaymentData,
    clearError
  } = usePayment();

  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'bank_transfer',
    bankCode: '',
    gateway: 'qeawapay',
    subject: 'Trading Platform Recharge',
    description: ''
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [currentStep, setCurrentStep] = useState('form'); // form, processing, success, error
  const [paymentData, setPaymentData] = useState(null);
  const [paymentWindow, setPaymentWindow] = useState(null);

  // Load payment methods on mount
  useEffect(() => {
    if (isOpen) {
      getPaymentMethods(formData.gateway);
    }
  }, [isOpen, formData.gateway, getPaymentMethods]);

  // Auto-fill description based on amount
  useEffect(() => {
    if (formData.amount) {
      setFormData(prev => ({
        ...prev,
        description: `Recharge for ${formatAmount(formData.amount)}`
      }));
    }
  }, [formData.amount, formatAmount]);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle gateway change
  const handleGatewayChange = (gateway) => {
    setFormData(prev => ({
      ...prev,
      gateway,
      bankCode: '' // Reset bank selection
    }));
    getPaymentMethods(gateway);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    // Validate form data
    const validation = validatePaymentData(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setCurrentStep('processing');
    
    // Create payment
    const result = await createPayment(formData);
    
    if (result.success) {
      setPaymentData(result.data);
      
      // Open payment window or show QR code
      if (result.data.paymentUrl) {
        const window = openPaymentWindow(result.data.paymentUrl, result.data.orderId);
        setPaymentWindow(window);
      }
      
      // Start polling payment status
      pollPaymentStatus(
        result.data.orderId,
        handlePaymentStatusChange,
        30, // 30 attempts
        5000 // 5 seconds interval
      );
    } else {
      setCurrentStep('error');
    }
  };

  // Handle payment status changes
  const handlePaymentStatusChange = (statusResult) => {
    if (statusResult.success) {
      const status = statusResult.data.status;
      
      if (status === 'completed') {
        setCurrentStep('success');
        if (paymentWindow) {
          paymentWindow.close();
        }
        setTimeout(() => {
          onSuccess?.(statusResult.data);
          handleClose();
        }, 2000);
      } else if (['failed', 'cancelled', 'expired'].includes(status)) {
        setCurrentStep('error');
        if (paymentWindow) {
          paymentWindow.close();
        }
      }
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (paymentWindow) {
      paymentWindow.close();
    }
    setCurrentStep('form');
    setFormData({
      amount: '',
      paymentMethod: 'bank_transfer',
      bankCode: '',
      gateway: 'qeawapay',
      subject: 'Trading Platform Recharge',
      description: ''
    });
    setValidationErrors({});
    setPaymentData(null);
    clearError();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        // Close modal when clicking on backdrop
        if (e.target === e.currentTarget && currentStep !== 'processing') {
          handleClose();
        }
      }}
    >
      <div 
        className="rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto" 
        style={{ backgroundColor: '#121818' }}
        onClick={(e) => e.stopPropagation()} // Prevent backdrop close when clicking inside modal
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            {currentStep === 'form' && 'Add Funds'}
            {currentStep === 'processing' && 'Processing Payment'}
            {currentStep === 'success' && 'Payment Successful'}
            {currentStep === 'error' && 'Payment Failed'}
          </h2>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClose();
            }}
            className="text-gray-400 hover:text-white transition-colors p-1"
            disabled={currentStep === 'processing'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Form Step */}
          {currentStep === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Gateway Selection */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Payment Gateway
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['qeawapay', 'watchglb'].map((gateway) => (
                    <button
                      key={gateway}
                      type="button"
                      onClick={() => handleGatewayChange(gateway)}
                      className={`p-3 text-sm font-medium rounded-lg border transition-colors ${
                        formData.gateway === gateway
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {gateway === 'qeawapay' ? 'QeawaPay' : 'WatchGLB'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="Enter amount"
                  min="100"
                  max="500000"
                  className={`w-full px-3 py-2 bg-gray-700 text-white border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.amount ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {validationErrors.amount && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.amount}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">Minimum: ₹100, Maximum: ₹500,000</p>
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[500, 1000, 2000, 5000].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handleInputChange('amount', amount.toString())}
                    className="px-3 py-2 text-sm font-medium text-blue-400 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    ₹{amount}
                  </button>
                ))}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Payment Method
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {paymentMethods.map((method) => (
                    <option key={method.code} value={method.code}>
                      {method.icon} {method.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bank Selection */}
              {formData.paymentMethod === 'bank_transfer' && (
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Select Bank
                  </label>
                  <select
                    value={formData.bankCode}
                    onChange={(e) => handleInputChange('bankCode', e.target.value)}
                    className={`w-full px-3 py-2 bg-gray-700 text-white border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors.bankCode ? 'border-red-500' : 'border-gray-600'
                    }`}
                  >
                    <option value="" className="bg-gray-700">Select Bank</option>
                    {supportedBanks.map((bank) => (
                      <option key={bank.code} value={bank.code} className="bg-gray-700">
                        {bank.name}
                      </option>
                    ))}
                  </select>
                  {validationErrors.bankCode && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.bankCode}</p>
                  )}
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating Payment...' : `Pay ${formData.amount ? formatAmount(formData.amount) : '₹0'}`}
              </button>
            </form>
          )}

          {/* Processing Step */}
          {currentStep === 'processing' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-white mb-2">Processing Payment</h3>
              <p className="text-sm text-gray-400 mb-4">
                Please complete your payment in the opened window
              </p>
              {paymentData && (
                <div className="bg-gray-700 rounded-lg p-4 text-left">
                  <p className="text-sm text-gray-300">Order ID: {paymentData.orderId}</p>
                  <p className="text-sm text-gray-300">Amount: {formatAmount(paymentData.amount)}</p>
                  <p className="text-sm text-gray-300">Gateway: {paymentData.gateway}</p>
                  
                  {/* QR Code for UPI payments */}
                  {formData.paymentMethod === 'upi' && paymentData.qrCode && (
                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-300 mb-2">Scan QR Code to Pay:</p>
                      <div className="bg-white p-4 rounded-lg inline-block">
                        <div className="w-32 h-32 bg-gray-200 flex items-center justify-center text-gray-600 text-xs flex-col">
                          <div className="text-lg mb-1">📱</div>
                          <div>UPI QR</div>
                          <div className="font-bold">₹{paymentData.amount}</div>
                          <div className="text-xs">{paymentData.gateway}</div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        UPI ID: merchant@{paymentData.gateway}
                      </p>
                      <button 
                        onClick={() => window.open(paymentData.qrCode)}
                        className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                      >
                        Open UPI App
                      </button>
                    </div>
                  )}
                  
                  {/* Payment URL for other methods */}
                  {formData.paymentMethod !== 'upi' && paymentData.paymentUrl && (
                    <div className="mt-4 text-center">
                      <button 
                        onClick={() => window.open(paymentData.paymentUrl, '_blank')}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Complete Payment
                      </button>
                    </div>
                  )}
                  
                  {/* Manual Payment Completion for Testing */}
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-400 mb-3">
                      For testing: Click below to simulate payment completion
                    </p>
                    <button 
                      onClick={async () => {
                        try {
                          const response = await api.post(`/payments/test/complete/${paymentData.orderId}`);
                          if (response.data.success) {
                            handlePaymentStatusChange({
                              success: true,
                              data: response.data.data
                            });
                          }
                        } catch (error) {
                          console.error('Payment completion error:', error);
                        }
                      }}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      ✅ Complete Payment
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Success Step */}
          {currentStep === 'success' && (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Payment Successful!</h3>
              <p className="text-sm text-gray-400 mb-4">
                Your account has been credited successfully
              </p>
              {paymentData && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-left">
                  <p className="text-sm text-green-400">Amount: {formatAmount(paymentData.amount)}</p>
                  <p className="text-sm text-green-400">Order ID: {paymentData.orderId}</p>
                </div>
              )}
            </div>
          )}

          {/* Error Step */}
          {currentStep === 'error' && (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Payment Failed</h3>
              <p className="text-sm text-gray-400 mb-4">
                {error || 'Something went wrong with your payment'}
              </p>
              <button
                onClick={() => setCurrentStep('form')}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
