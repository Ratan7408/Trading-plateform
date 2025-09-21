import axios from 'axios';
import { PaymentCrypto } from '../utils/crypto.js';
import logger from '../utils/logger.js';

/**
 * WatchGLB Payment Service
 * Handles all WatchGLB API interactions
 */

export class WatchGLBService {
  constructor() {
    this.gateway = 'watchglb';
    this.baseUrl = 'https://api.watchglb.com'; // Fixed API domain from documentation
    
    this.merchantNumber = process.env.WATCHGLB_SANDBOX === 'true'
      ? process.env.WATCHGLB_SANDBOX_MERCHANT_NUMBER
      : process.env.WATCHGLB_MERCHANT_NUMBER;
    
    this.paymentKey = process.env.WATCHGLB_SANDBOX === 'true'
      ? process.env.WATCHGLB_SANDBOX_PAYMENT_KEY
      : process.env.WATCHGLB_PAYMENT_KEY;
    
    this.payoutKey = process.env.WATCHGLB_SANDBOX === 'true'
      ? process.env.WATCHGLB_SANDBOX_PAYOUT_KEY
      : process.env.WATCHGLB_PAYOUT_KEY;

    this.callbackUrl = process.env.WATCHGLB_CALLBACK_URL || 'http://localhost:5000/api/payments/watchglb/callback';
    this.returnUrl = process.env.WATCHGLB_RETURN_URL || 'http://localhost:5173/payment/success';
    this.cancelUrl = process.env.WATCHGLB_CANCEL_URL || 'http://localhost:5173/payment/cancel';

    // Payment type codes
    this.paymentTypes = {
      BANK: process.env.WATCHGLB_PAYMENT_TYPE_BANK,
      UPI: process.env.WATCHGLB_PAYMENT_TYPE_UPI,
      WALLET: process.env.WATCHGLB_PAYMENT_TYPE_WALLET
    };

    // Configure axios defaults
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TradingPlatform/1.0'
      }
    });

    logger.info('WatchGLB service initialized', {
      baseUrl: this.baseUrl,
      merchantNumber: this.merchantNumber,
      documentation: 'https://www.showdoc.com.cn/WatchPay (password: watchpay277)'
    }, this.gateway);
  }

  /**
   * Create payment order
   */
  async createPayment(paymentData) {
    let orderId;
    try {
      orderId = PaymentCrypto.generateOrderId('WG');
      const timestamp = Math.floor(Date.now() / 1000);
      
      const params = {
        merchantNumber: this.merchantNumber,
        orderNumber: orderId,
        amount: paymentData.amount,
        currency: paymentData.currency || 'INR',
        productName: paymentData.subject || 'Trading Platform Recharge',
        productDesc: paymentData.description || `Recharge for ${paymentData.amount} INR`,
        paymentType: this.getPaymentTypeCode(paymentData.paymentMethod),
        bankCode: paymentData.bankCode || '',
        notifyUrl: this.callbackUrl,
        returnUrl: this.returnUrl,
        cancelUrl: this.cancelUrl,
        timestamp: timestamp,
        nonce: PaymentCrypto.generateNonce(),
        customerName: paymentData.userName || 'User',
        customerEmail: paymentData.userEmail || '',
        customerPhone: paymentData.userPhone || '',
        customerIP: paymentData.customerIP || '',
        extraParam: JSON.stringify({
          platform: 'trading',
          version: '1.0',
          userId: paymentData.userId
        })
      };

      // Generate signature
      params.sign = PaymentCrypto.generateWatchGLBSignature(params, this.paymentKey);

      logger.paymentInitiated(this.gateway, orderId, paymentData.amount, {
        currency: params.currency,
        method: paymentData.paymentMethod,
        userId: paymentData.userId
      });

      // Make API request to correct endpoint
      const response = await this.client.post('/pay/web', params);

      if (response.data.code === '0000' || response.data.status === 'success') {
        logger.info('Payment order created successfully', {
          orderId,
          paymentUrl: response.data.data?.paymentUrl
        }, this.gateway);

        return {
          success: true,
          orderId,
          paymentUrl: response.data.data?.paymentUrl || response.data.paymentUrl,
          qrCode: response.data.data?.qrCode,
          transactionId: response.data.data?.transactionId,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
          gateway: this.gateway,
          amount: paymentData.amount,
          currency: params.currency
        };
      } else {
        throw new Error(`WatchGLB API Error: ${response.data.message || response.data.msg || 'Unknown error'}`);
      }

    } catch (error) {
      const failedOrderId = orderId || 'UNKNOWN';
      logger.paymentFailed(this.gateway, failedOrderId, error.message, {
        errorCode: error.response?.data?.code,
        errorMessage: error.response?.data?.message || error.response?.data?.msg
      });

      return {
        success: false,
        error: error.message,
        code: error.response?.data?.code || 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * Query payment status
   */
  async queryPayment(orderId) {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      
      const params = {
        merchantNumber: this.merchantNumber,
        orderNumber: orderId,
        timestamp: timestamp,
        nonce: PaymentCrypto.generateNonce()
      };

      params.sign = PaymentCrypto.generateWatchGLBSignature(params, this.paymentKey);

      const response = await this.client.post('/query/payment', params);

      if (response.data.code === '0000') {
        const paymentData = response.data.data;
        
        logger.info('Payment status queried', {
          orderId,
          status: paymentData.status,
          amount: paymentData.amount
        }, this.gateway);

        return {
          success: true,
          status: this.mapPaymentStatus(paymentData.status),
          orderId: paymentData.orderNumber,
          transactionId: paymentData.transactionId,
          amount: parseFloat(paymentData.amount),
          currency: paymentData.currency,
          paidAt: paymentData.paidTime ? new Date(paymentData.paidTime * 1000) : null,
          rawStatus: paymentData.status
        };
      } else {
        throw new Error(`Query failed: ${response.data.message || response.data.msg}`);
      }

    } catch (error) {
      logger.error('Payment query failed', error, this.gateway);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process webhook callback
   */
  async processCallback(callbackData, signature) {
    try {
      logger.webhookReceived(this.gateway, {
        orderId: callbackData.orderNumber,
        status: callbackData.status,
        ip: callbackData.ip || 'unknown'
      });

      // Verify signature
      const isValidSignature = PaymentCrypto.verifyWatchGLBSignature(
        callbackData,
        this.paymentKey,
        signature
      );

      logger.signatureVerification(this.gateway, callbackData.orderNumber, isValidSignature);

      if (!isValidSignature) {
        throw new Error('Invalid signature');
      }

      // Process the payment update
      const result = {
        orderId: callbackData.orderNumber,
        transactionId: callbackData.transactionId,
        status: this.mapPaymentStatus(callbackData.status),
        amount: parseFloat(callbackData.amount),
        currency: callbackData.currency,
        paidAt: callbackData.paidTime ? new Date(callbackData.paidTime * 1000) : new Date(),
        gateway: this.gateway,
        rawData: callbackData
      };

      logger.paymentCompleted(this.gateway, result.orderId, result.status, result);

      return {
        success: true,
        data: result
      };

    } catch (error) {
      logger.error('Callback processing failed', error, this.gateway);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create payout request
   */
  async createPayout(payoutData) {
    try {
      const payoutId = PaymentCrypto.generateOrderId('WG_PAYOUT');
      const timestamp = Math.floor(Date.now() / 1000);
      
      const params = {
        merchantNumber: this.merchantNumber,
        payoutNumber: payoutId,
        amount: payoutData.amount,
        currency: payoutData.currency || 'INR',
        accountName: payoutData.accountName,
        accountNumber: payoutData.accountNumber,
        bankCode: payoutData.bankCode,
        ifscCode: payoutData.ifscCode,
        mobile: payoutData.mobile || '',
        email: payoutData.email || '',
        timestamp: timestamp,
        nonce: PaymentCrypto.generateNonce(),
        notifyUrl: this.callbackUrl.replace('/callback', '/payout-callback'),
        extraParam: JSON.stringify({
          userId: payoutData.userId,
          platform: 'trading'
        })
      };

      params.sign = PaymentCrypto.generateWatchGLBSignature(params, this.payoutKey);

      logger.info('Payout initiated', {
        payoutId,
        amount: payoutData.amount,
        accountNumber: payoutData.accountNumber.slice(-4) // Only last 4 digits
      }, this.gateway);

      const response = await this.client.post('/pay/transfer', params);

      if (response.data.code === '0000') {
        return {
          success: true,
          payoutId,
          status: 'pending',
          amount: payoutData.amount,
          currency: params.currency,
          estimatedTime: '1-3 business days',
          transactionId: response.data.data?.transactionId
        };
      } else {
        throw new Error(`Payout failed: ${response.data.message || response.data.msg}`);
      }

    } catch (error) {
      logger.error('Payout creation failed', error, this.gateway);
      
      return {
        success: false,
        error: error.message,
        code: error.response?.data?.code || 'PAYOUT_ERROR'
      };
    }
  }

  /**
   * Get payment type code
   */
  getPaymentTypeCode(method) {
    const methodMap = {
      'bank_transfer': this.paymentTypes.BANK,
      'upi': this.paymentTypes.UPI,
      'wallet': this.paymentTypes.WALLET,
      'netbanking': this.paymentTypes.BANK
    };

    return methodMap[method] || this.paymentTypes.BANK;
  }

  /**
   * Map WatchGLB status to standard status
   */
  mapPaymentStatus(status) {
    const statusMap = {
      'pending': 'pending',
      'processing': 'processing',
      'success': 'completed',
      'paid': 'completed',
      'completed': 'completed',
      'failed': 'failed',
      'cancelled': 'cancelled',
      'expired': 'expired',
      'timeout': 'expired'
    };

    return statusMap[status.toLowerCase()] || 'unknown';
  }

  /**
   * Get supported payment methods
   */
  getPaymentMethods() {
    return [
      { 
        code: 'bank_transfer', 
        name: 'Bank Transfer', 
        icon: '🏦',
        typeCode: this.paymentTypes.BANK
      },
      { 
        code: 'upi', 
        name: 'UPI', 
        icon: '📱',
        typeCode: this.paymentTypes.UPI
      },
      { 
        code: 'wallet', 
        name: 'Digital Wallet', 
        icon: '💳',
        typeCode: this.paymentTypes.WALLET
      }
    ];
  }

  /**
   * Get supported banks
   */
  getSupportedBanks() {
    return [
      { code: process.env.WATCHGLB_BANK_CODE_SBI, name: 'State Bank of India' },
      { code: process.env.WATCHGLB_BANK_CODE_HDFC, name: 'HDFC Bank' },
      { code: process.env.WATCHGLB_BANK_CODE_ICICI, name: 'ICICI Bank' },
      { code: 'AXIS', name: 'Axis Bank' },
      { code: 'PNB', name: 'Punjab National Bank' },
      { code: 'BOB', name: 'Bank of Baroda' },
      { code: 'CANARA', name: 'Canara Bank' },
      { code: 'UNION', name: 'Union Bank of India' },
      { code: 'KOTAK', name: 'Kotak Mahindra Bank' },
      { code: 'YES', name: 'Yes Bank' }
    ];
  }

  /**
   * Query account balance
   */
  async queryBalance() {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      
      const params = {
        merchantNumber: this.merchantNumber,
        timestamp: timestamp,
        nonce: PaymentCrypto.generateNonce()
      };

      params.sign = PaymentCrypto.generateWatchGLBSignature(params, this.paymentKey);

      const response = await this.client.post('/query/balance', params);

      if (response.data.code === '0000') {
        const balanceData = response.data.data;
        
        logger.info('Balance queried successfully', {
          merchantNumber: this.merchantNumber,
          balance: balanceData.balance
        }, this.gateway);

        return {
          success: true,
          balance: parseFloat(balanceData.balance),
          currency: balanceData.currency || 'INR',
          lastUpdated: new Date()
        };
      } else {
        throw new Error(`Balance query failed: ${response.data.message || response.data.msg}`);
      }

    } catch (error) {
      logger.error('Balance query failed', error, this.gateway);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Query payout/transfer status
   */
  async queryPayout(payoutId) {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      
      const params = {
        merchantNumber: this.merchantNumber,
        payoutNumber: payoutId,
        timestamp: timestamp,
        nonce: PaymentCrypto.generateNonce()
      };

      params.sign = PaymentCrypto.generateWatchGLBSignature(params, this.payoutKey);

      const response = await this.client.post('/query/transfer', params);

      if (response.data.code === '0000') {
        const payoutData = response.data.data;
        
        logger.info('Payout status queried', {
          payoutId,
          status: payoutData.status,
          amount: payoutData.amount
        }, this.gateway);

        return {
          success: true,
          status: this.mapPaymentStatus(payoutData.status),
          payoutId: payoutData.payoutNumber,
          transactionId: payoutData.transactionId,
          amount: parseFloat(payoutData.amount),
          currency: payoutData.currency,
          processedAt: payoutData.processedTime ? new Date(payoutData.processedTime * 1000) : null,
          rawStatus: payoutData.status
        };
      } else {
        throw new Error(`Payout query failed: ${response.data.message || response.data.msg}`);
      }

    } catch (error) {
      logger.error('Payout query failed', error, this.gateway);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate merchant configuration
   */
  validateConfig() {
    const required = [
      'merchantNumber',
      'paymentKey',
      'payoutKey',
      'baseUrl'
    ];

    const missing = required.filter(key => !this[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing WatchGLB configuration: ${missing.join(', ')}`);
    }

    return true;
  }
}

export default WatchGLBService;
