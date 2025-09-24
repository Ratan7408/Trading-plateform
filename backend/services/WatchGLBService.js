import axios from 'axios';
import https from 'https';
import { PaymentCrypto } from '../utils/crypto.js';
import logger from '../utils/logger.js';

/**
 * WatchGLB Payment Service - OFFICIAL API VERSION
 * Based on official documentation: https://www.showdoc.com.cn/WatchPay (password: watchpay277)
 * 
 * Official Endpoints:
 * - Recharge: https://api.watchglb.com/pay/web
 * - Payout: https://api.watchglb.com/pay/transfer
 * - Payout Query: https://api.watchglb.com/query/transfer
 * - Balance Query: https://api.watchglb.com/query/balance
 * - Merchant Portal: https://merchant.watchglb.com
 */

export class WatchGLBService {
  constructor() {
    this.gateway = 'watchglb';
    // Official WatchGLB API domain
    this.baseUrl = process.env.WATCHGLB_BASE_URL || 'https://api.watchglb.com';
    this.alternateBaseUrls = [
      'https://api.watchglb.com',
      'https://api.watchpay.com'
    ].filter(url => url !== this.baseUrl);
    
    this.merchantId = process.env.WATCHGLB_MERCHANT_ID;
    this.depositKey = process.env.WATCHGLB_DEPOSIT_KEY;
    this.payoutKey = process.env.WATCHGLB_PAYOUT_KEY;
    
    // Minimal console output per user preference

    this.callbackUrl = process.env.WATCHGLB_CALLBACK_URL;
    this.returnUrl = process.env.WATCHGLB_RETURN_URL;
    this.cancelUrl = process.env.WATCHGLB_CANCEL_URL;

    // Payment type codes from merchant backend
    this.paymentTypes = {
      BANK: process.env.WATCHGLB_PAYMENT_TYPE_BANK || '101',
      UPI: process.env.WATCHGLB_PAYMENT_TYPE_UPI || '102',
      WALLET: process.env.WATCHGLB_PAYMENT_TYPE_WALLET || '103'
    };

    // Configure axios defaults with TLS fixes (Node/OpenSSL on Windows)
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'TradingPlatform/1.0'
      },
      // TLS settings: allow TLS 1.2+, relax cert only in dev
      httpsAgent: new https.Agent({
        rejectUnauthorized: process.env.NODE_ENV === 'production',
        minVersion: 'TLSv1.2'
      })
    });

    // Validate configuration (non-throwing). Methods will guard on this.
    this.configValid = false;
    this.missingKeys = [];
    this.validateConfig();

    logger.info('WatchGLB service initialized', {
      baseUrl: this.baseUrl,
      merchantId: this.merchantId,
      hasDepositKey: !!this.depositKey,
      hasPayoutKey: !!this.payoutKey,
      documentation: 'https://www.showdoc.com.cn/WatchPay'
    }, this.gateway);
  }

  /**
   * Create payment order
   * Endpoint: POST https://api.watchglb.com/pay/web
   */
  async createPayment(paymentData) {
    let orderId;
    try {
      if (!this.configValid) {
        return {
          success: false,
          error: `WatchGLB configuration incomplete: ${this.missingKeys.join(', ')}`,
          code: 'CONFIG_INCOMPLETE'
        };
      }
      orderId = PaymentCrypto.generateOrderId('WG');
      const timestamp = Math.floor(Date.now() / 1000);
      
      // Updated WatchGLB API parameters per latest spec
      const params = {
        version: '1.0',
        mch_id: this.merchantId,
        mch_order_no: orderId,
        notify_url: this.callbackUrl,
        page_url: this.returnUrl,
        pay_type: paymentData.payType || this.getPaymentTypeCode(paymentData.paymentMethod),
        bank_code: paymentData.bankCode,
        trade_amount: Number(paymentData.amount).toFixed(2),
        order_date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        goods_name: paymentData.subject || 'Trading Platform Recharge',
        // currency field intentionally removed
        sign_type: 'MD5'
      };

      // Remove noisy optional params; keep only bank_code if provided
      if (!paymentData.bankCode) {
        delete params.bank_code;
      }

      // Generate signature using MD5 (uppercase, excluding sign/sign_type)
      params.sign = PaymentCrypto.generateWatchGLBSignature(params, this.depositKey);

      logger.paymentInitiated(this.gateway, orderId, paymentData.amount, {
        currency: params.currency,
        paymentType: params.paymentType,
        userId: paymentData.userId
      });

      // Make API request with form-encoded data (with retry on TLS/host errors)
      const doRequest = async (client) => client.post('/pay/web', PaymentCrypto.urlEncode(params));

      let response;
      try {
        response = await doRequest(this.client);
      } catch (primaryError) {
        const retryable = ['EPROTO', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'ERR_TLS_CERT_ALTNAME_INVALID'];
        if (retryable.includes(primaryError?.code) && this.alternateBaseUrls.length > 0) {
          const alt = this.alternateBaseUrls[0];
          logger.warn('Primary WatchGLB host failed TLS; retrying with alternate', { primary: this.baseUrl, alternate: alt, code: primaryError.code });
          const altClient = axios.create({
            baseURL: alt,
            timeout: 30000,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'TradingPlatform/1.0' },
            httpsAgent: new https.Agent({ rejectUnauthorized: process.env.NODE_ENV === 'production', minVersion: 'TLSv1.2' })
          });
          response = await doRequest(altClient);
        } else {
          throw primaryError;
        }
      }

      logger.info('WatchGLB API Response:', response.data);

      // Check response - Official WatchGLB response format
      if (response.data.respCode === 'SUCCESS' && response.data.tradeResult === '1') {
        const result = {
          success: true,
          orderId,
          paymentUrl: response.data.payInfo,
          qrCode: response.data.payInfo, // WatchGLB returns payInfo as payment URL
          transactionId: response.data.orderNo,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
          gateway: this.gateway,
          amount: Number(paymentData.amount),
          currency: 'INR'
        };

        logger.info('Payment order created successfully', result);
        return result;

      } else {
        const errorMsg = response.data.tradeMsg || response.data.errorMsg || 'Payment creation failed';
        throw new Error(`WatchGLB Error: ${errorMsg} (Code: ${response.data.respCode})`);
      }

    } catch (error) {
      console.log('🚨 WatchGLB Error Details:');
      console.log('Error Message:', error.message);
      console.log('Error Code:', error.code);
      console.log('Response Status:', error.response?.status);
      console.log('Response Data:', error.response?.data);
      console.log('Request URL:', error.config?.url);
      console.log('Request Data:', error.config?.data);

      logger.paymentFailed(this.gateway, orderId || 'UNKNOWN', error.message, {
        errorCode: error.response?.data?.code,
        errorMessage: error.response?.data?.message || error.response?.data?.msg,
        responseData: error.response?.data,
        status: error.response?.status
      });

      return {
        success: false,
        error: error.message,
        code: error.response?.data?.code || error.code || 'UNKNOWN_ERROR',
        details: error.response?.data
      };
    }
  }

  /**
   * Query payment status
   * Endpoint: POST https://api.watchglb.com/query/payment
   */
  async queryPayment(orderId) {
    try {
      if (!this.configValid) {
        return { success: false, error: `Config incomplete: ${this.missingKeys.join(', ')}` };
      }
      const timestamp = Math.floor(Date.now() / 1000);
      
      const params = {
        merchant_id: this.merchantId,
        order_no: orderId,
        timestamp: timestamp,
        nonce: PaymentCrypto.generateNonce(),
        sign_type: 'SHA256'
      };

      params.sign = PaymentCrypto.generateWatchGLBSignature(params, this.depositKey);

      const response = await this.client.post('/query/payment', 
        PaymentCrypto.urlEncode(params)
      );

      if (response.data.code === '0000' || response.data.code === 0) {
        const paymentData = response.data.data;
        
        logger.info('Payment status queried', {
          orderId,
          status: paymentData.status,
          amount: paymentData.amount
        }, this.gateway);

        return {
          success: true,
          status: this.mapPaymentStatus(paymentData.status),
          orderId: paymentData.order_no || paymentData.orderNumber,
          transactionId: paymentData.transaction_id || paymentData.transactionId,
          amount: parseFloat(paymentData.amount),
          currency: paymentData.currency,
          paidAt: paymentData.paid_time ? new Date(paymentData.paid_time * 1000) : (paymentData.paidTime ? new Date(paymentData.paidTime * 1000) : null),
          rawStatus: paymentData.status
        };
      } else {
        throw new Error(`Query failed: ${response.data.message || response.data.msg || response.data.error}`);
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
        this.depositKey,
        signature || callbackData.sign
      );

      if (!isValidSignature) {
        throw new Error('Invalid signature');
      }

      // Process the payment update
      const result = {
        orderId: callbackData.orderNumber,
        transactionId: callbackData.transactionId,
        status: this.mapPaymentStatus(callbackData.status),
        amount: parseFloat(callbackData.amount),
        currency: callbackData.currency || 'INR',
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
   * Endpoint: POST https://api.watchglb.com/pay/transfer
   */
  async createPayout(payoutData) {
    try {
      if (!this.configValid) {
        return {
          success: false,
          error: `WatchGLB configuration incomplete: ${this.missingKeys.join(', ')}`,
          code: 'CONFIG_INCOMPLETE'
        };
      }
      const payoutId = PaymentCrypto.generateOrderId('WG_PAYOUT');
      const timestamp = Math.floor(Date.now() / 1000);
      
      const params = {
        merchant_id: this.merchantId,
        payout_no: payoutId,
        amount: payoutData.amount,
        currency: payoutData.currency || 'INR',
        account_name: payoutData.accountName,
        account_number: payoutData.accountNumber,
        bank_code: payoutData.bankCode,
        ifsc_code: payoutData.ifscCode,
        timestamp: timestamp,
        nonce: PaymentCrypto.generateNonce(),
        notify_url: this.callbackUrl.replace('/callback', '/payout-callback'),
        sign_type: 'SHA256'
      };

      // Add optional parameters
      if (payoutData.mobile) {
        params.mobile = payoutData.mobile;
      }

      if (payoutData.email) {
        params.email = payoutData.email;
      }

      params.extra_param = JSON.stringify({
        userId: payoutData.userId,
        platform: 'trading'
      });

      params.sign = PaymentCrypto.generateWatchGLBSignature(params, this.payoutKey);

      logger.info('Payout initiated', {
        payoutId,
        amount: payoutData.amount,
        accountNumber: payoutData.accountNumber.slice(-4)
      }, this.gateway);

      const response = await this.client.post('/pay/transfer', 
        PaymentCrypto.urlEncode(params)
      );

      if (response.data.code === '0000' || response.data.code === 0) {
        return {
          success: true,
          payoutId,
          status: 'pending',
          amount: payoutData.amount,
          currency: params.currency,
          estimatedTime: '1-3 business days',
          transactionId: response.data.data?.transaction_id || response.data.data?.transactionId
        };
      } else {
        throw new Error(`Payout failed: ${response.data.message || response.data.msg || response.data.error}`);
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
   * Query payout/transfer status
   * Endpoint: POST https://api.watchglb.com/query/transfer
   */
  async queryPayout(payoutId) {
    try {
      if (!this.configValid) {
        return { success: false, error: `Config incomplete: ${this.missingKeys.join(', ')}` };
      }
      const timestamp = Math.floor(Date.now() / 1000);
      
      const params = {
        merchant_id: this.merchantId,
        payout_no: payoutId,
        timestamp: timestamp,
        nonce: PaymentCrypto.generateNonce(),
        sign_type: 'SHA256'
      };

      params.sign = PaymentCrypto.generateWatchGLBSignature(params, this.payoutKey);

      const response = await this.client.post('/query/transfer', 
        PaymentCrypto.urlEncode(params)
      );

      if (response.data.code === '0000' || response.data.code === 0) {
        const payoutData = response.data.data;
        
        return {
          success: true,
          status: this.mapPaymentStatus(payoutData.status),
          payoutId: payoutData.payout_no || payoutData.payoutNumber,
          transactionId: payoutData.transaction_id || payoutData.transactionId,
          amount: parseFloat(payoutData.amount),
          currency: payoutData.currency,
          processedAt: payoutData.processed_time ? new Date(payoutData.processed_time * 1000) : (payoutData.processedTime ? new Date(payoutData.processedTime * 1000) : null),
          rawStatus: payoutData.status
        };
      } else {
        throw new Error(`Payout query failed: ${response.data.message || response.data.msg || response.data.error}`);
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
   * Query account balance
   * Endpoint: POST https://api.watchglb.com/query/balance
   */
  async queryBalance() {
    try {
      if (!this.configValid) {
        return { success: false, error: `Config incomplete: ${this.missingKeys.join(', ')}` };
      }
      const timestamp = Math.floor(Date.now() / 1000);
      
      const params = {
        merchant_id: this.merchantId,
        timestamp: timestamp,
        nonce: PaymentCrypto.generateNonce(),
        sign_type: 'SHA256'
      };

      params.sign = PaymentCrypto.generateWatchGLBSignature(params, this.depositKey);

      const response = await this.client.post('/query/balance', 
        PaymentCrypto.urlEncode(params)
      );

      if (response.data.code === '0000' || response.data.code === 0) {
        const balanceData = response.data.data;
        
        logger.info('Balance queried successfully', {
          merchantId: this.merchantId,
          balance: balanceData.balance
        }, this.gateway);

        return {
          success: true,
          balance: parseFloat(balanceData.balance),
          currency: balanceData.currency || 'INR',
          lastUpdated: new Date()
        };
      } else {
        throw new Error(`Balance query failed: ${response.data.message || response.data.msg || response.data.error}`);
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
   * Get payment type code based on official WatchGLB documentation
   */
  getPaymentTypeCode(method) {
    // Allow environment overrides per merchant configuration
    const upi = process.env.WATCHGLB_PAYTYPE_UPI || '105'; // UPI Entertainment default
    const bank = process.env.WATCHGLB_PAYTYPE_BANK || '101'; // Paytm Native default
    const wallet = process.env.WATCHGLB_PAYTYPE_WALLET || '104';
    const netbanking = process.env.WATCHGLB_PAYTYPE_NETBANKING || '100';

    const methodMap = {
      'bank_transfer': bank,
      'upi': upi,
      'wallet': wallet,
      'netbanking': netbanking
    };

    return methodMap[method] || bank;
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
      { code: process.env.WATCHGLB_BANK_CODE_SBI || 'SBI', name: 'State Bank of India' },
      { code: process.env.WATCHGLB_BANK_CODE_HDFC || 'HDFC', name: 'HDFC Bank' },
      { code: process.env.WATCHGLB_BANK_CODE_ICICI || 'ICICI', name: 'ICICI Bank' },
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
   * Validate merchant configuration
   */
  validateConfig() {
    console.log('🔍 WatchGLB Config Validation:');
    console.log('  merchantId:', this.merchantId);
    console.log('  depositKey:', this.depositKey ? 'SET' : 'NOT SET');
    console.log('  payoutKey:', this.payoutKey ? 'SET' : 'NOT SET');
    console.log('  baseUrl:', this.baseUrl);
    
    const required = [
      { key: 'merchantId', value: this.merchantId },
      { key: 'depositKey', value: this.depositKey },
      { key: 'payoutKey', value: this.payoutKey },
      { key: 'baseUrl', value: this.baseUrl }
    ];
    this.missingKeys = required.filter(item => !item.value).map(item => item.key);
    this.configValid = this.missingKeys.length === 0;
    
    console.log('  missingKeys:', this.missingKeys);
    console.log('  configValid:', this.configValid);
    
    if (!this.configValid) {
      logger.error('WatchGLB configuration incomplete', {
        missing: this.missingKeys,
        merchantId: this.merchantId ? 'SET' : 'NOT SET',
        depositKey: this.depositKey ? 'SET' : 'NOT SET',
        payoutKey: this.payoutKey ? 'SET' : 'NOT SET',
        baseUrl: this.baseUrl
      }, this.gateway);
    }
    return this.configValid;
  }
}

export default WatchGLBService;