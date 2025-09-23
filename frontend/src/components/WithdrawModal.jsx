import { useState, useEffect } from 'react';
import { usePayment } from '../hooks/usePayment';

/**
 * Withdraw Modal Component
 * Handles payout/withdrawal requests
 */

const WithdrawModal = ({ isOpen, onClose, onSuccess, userBalance = 0 }) => {
  const {
    loading,
    error,
    createPayout,
    formatAmount,
    validatePayoutData,
    clearError
  } = usePayment();

  const [formData, setFormData] = useState({
    amount: '',
    accountName: '',
    accountNumber: '',
    bankCode: 'SBI',
    ifscCode: '',
    mobile: '',
    email: '',
    gateway: 'watchglb'
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [currentStep, setCurrentStep] = useState('form'); // form, processing, success, error
  const [payoutData, setPayoutData] = useState(null);

  // Supported banks
  const supportedBanks = [
    { code: 'SBI', name: 'State Bank of India' },
    { code: 'HDFC', name: 'HDFC Bank' },
    { code: 'ICICI', name: 'ICICI Bank' },
    { code: 'AXIS', name: 'Axis Bank' },
    { code: 'PNB', name: 'Punjab National Bank' },
    { code: 'BOB', name: 'Bank of Baroda' },
    { code: 'CANARA', name: 'Canara Bank' },
    { code: 'UNION', name: 'Union Bank of India' }
  ];

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

  // Format account number input
  const handleAccountNumberChange = (value) => {
    // Remove any non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    handleInputChange('accountNumber', numericValue);
  };

  // Format IFSC code input
  const handleIfscChange = (value) => {
    // Convert to uppercase and limit to 11 characters
    const formattedValue = value.toUpperCase().slice(0, 11);
    handleInputChange('ifscCode', formattedValue);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    // Validate form data
    const validation = validatePayoutData(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    // Check if user has sufficient balance
    if (parseFloat(formData.amount) > userBalance) {
      setValidationErrors({ amount: 'Insufficient balance' });
      return;
    }

    setCurrentStep('processing');
    
    // Create payout
    const result = await createPayout(formData);
    
    if (result.success) {
      setPayoutData(result.data);
      setCurrentStep('success');
      setTimeout(() => {
        onSuccess?.(result.data);
        handleClose();
      }, 3000);
    } else {
      setCurrentStep('error');
    }
  };

  // Handle modal close
  const handleClose = () => {
    setCurrentStep('form');
    setFormData({
      amount: '',
      accountName: '',
      accountNumber: '',
      bankCode: 'SBI',
      ifscCode: '',
      mobile: '',
      email: '',
      gateway: 'watchglb'
    });
    setValidationErrors({});
    setPayoutData(null);
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
            {currentStep === 'form' && 'Withdraw Funds'}
            {currentStep === 'processing' && 'Processing Withdrawal'}
            {currentStep === 'success' && 'Withdrawal Successful'}
            {currentStep === 'error' && 'Withdrawal Failed'}
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
              {/* Available Balance */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-400">Available Balance</p>
                <p className="text-xl font-semibold text-blue-300">{formatAmount(userBalance)}</p>
              </div>

              {/* Gateway Selection */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Payment Gateway
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['watchglb'].map((gateway) => (
                    <button
                      key={gateway}
                      type="button"
                      onClick={() => handleInputChange('gateway', gateway)}
                      className={`p-3 text-sm font-medium rounded-lg border transition-colors ${
                        formData.gateway === gateway
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      WatchGLB
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Withdrawal Amount (₹)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="Enter amount"
                  min="500"
                  max={userBalance}
                  className={`w-full px-3 py-2 bg-gray-700 text-white border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.amount ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {validationErrors.amount && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.amount}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">Minimum: ₹500, Maximum: ₹100,000</p>
              </div>

              {/* Account Name */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  value={formData.accountName}
                  onChange={(e) => handleInputChange('accountName', e.target.value)}
                  placeholder="Enter account holder name"
                  className={`w-full px-3 py-2 bg-gray-700 text-white border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.accountName ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {validationErrors.accountName && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.accountName}</p>
                )}
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => handleAccountNumberChange(e.target.value)}
                  placeholder="Enter account number"
                  maxLength="18"
                  className={`w-full px-3 py-2 bg-gray-700 text-white border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.accountNumber ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {validationErrors.accountNumber && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.accountNumber}</p>
                )}
              </div>

              {/* Bank Selection */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Bank
                </label>
                <select
                  value={formData.bankCode}
                  onChange={(e) => handleInputChange('bankCode', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {supportedBanks.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* IFSC Code */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={formData.ifscCode}
                  onChange={(e) => handleIfscChange(e.target.value)}
                  placeholder="e.g., SBIN0001234"
                  maxLength="11"
                  className={`w-full px-3 py-2 bg-gray-700 text-white border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.ifscCode ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {validationErrors.ifscCode && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.ifscCode}</p>
                )}
              </div>

              {/* Mobile Number (Optional) */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Mobile Number (Optional)
                </label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                  placeholder="Enter mobile number"
                  className={`w-full px-3 py-2 bg-gray-700 text-white border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.mobile ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {validationErrors.mobile && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.mobile}</p>
                )}
              </div>

              {/* Email (Optional) */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                  className={`w-full px-3 py-2 bg-gray-700 text-white border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.email ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {validationErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                )}
              </div>

              {/* Processing Time Notice */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-sm text-yellow-400">
                  ⚠️ Withdrawal processing time: 1-3 business days
                </p>
              </div>

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
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Processing...' : `Withdraw ${formData.amount ? formatAmount(formData.amount) : '₹0'}`}
              </button>
            </form>
          )}

          {/* Processing Step */}
          {currentStep === 'processing' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-white mb-2">Processing Withdrawal</h3>
              <p className="text-sm text-gray-400 mb-4">
                Your withdrawal request is being processed...
              </p>
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
              <h3 className="text-lg font-medium text-white mb-2">Withdrawal Submitted!</h3>
              <p className="text-sm text-gray-400 mb-4">
                Your withdrawal request has been submitted successfully
              </p>
              {payoutData && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-left">
                  <p className="text-sm text-green-400">Amount: {formatAmount(payoutData.amount)}</p>
                  <p className="text-sm text-green-400">Payout ID: {payoutData.payoutId}</p>
                  <p className="text-sm text-green-400">Estimated Time: {payoutData.estimatedTime}</p>
                  <p className="text-sm text-green-400">New Balance: {formatAmount(payoutData.newBalance)}</p>
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
              <h3 className="text-lg font-medium text-white mb-2">Withdrawal Failed</h3>
              <p className="text-sm text-gray-400 mb-4">
                {error || 'Something went wrong with your withdrawal request'}
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

export default WithdrawModal;
