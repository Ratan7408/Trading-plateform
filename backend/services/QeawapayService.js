import axios from 'axios';
import { PaymentCrypto } from '../utils/crypto.js';
import logger from '../utils/logger.js';

/**
 * Qeawapay (QEPay) Payment Service
 * Handles all Qeawapay API interactions
 */

export class QeawapayService {
  constructor() {
    this.gateway = 'qeawapay';
    this.baseUrl = 'https://pay.qeawapay.com'; // Correct API endpoint from documentation
    
    this.merchantId = process.env.QEAWAPAY_SANDBOX === 'true'
      ? process.env.QEAWAPAY_SANDBOX_MERCHANT_ID
      : process.env.QEAWAPAY_MERCHANT_ID;
    
    this.collectionKey = process.env.QEAWAPAY_SANDBOX === 'true'
      ? process.env.QEAWAPAY_SANDBOX_COLLECTION_SECRET_KEY
      : process.env.QEAWAPAY_COLLECTION_SECRET_KEY;
    
    this.payoutKey = process.env.QEAWAPAY_SANDBOX === 'true'
      ? process.env.QEAWAPAY_SANDBOX_PAYOUT_SECRET_KEY
      : process.env.QEAWAPAY_PAYOUT_SECRET_KEY;

    this.callbackUrl = process.env.QEAWAPAY_CALLBACK_URL || 'http://localhost:5000/api/payments/qeawapay/callback';
    this.returnUrl = process.env.QEAWAPAY_RETURN_URL || 'http://localhost:5173/payment/success';
    this.cancelUrl = process.env.QEAWAPAY_CANCEL_URL || 'http://localhost:5173/payment/cancel';

    // Configure axios defaults
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'TradingPlatform/1.0'
      }
    });

    logger.info('Qeawapay service initialized', {
      baseUrl: this.baseUrl,
      merchantId: this.merchantId,
      sandbox: process.env.QEAWAPAY_SANDBOX === 'true'
    }, this.gateway);
  }

  /**
   * Create payment order
   */
  async createPayment(paymentData) {
    let orderId;
    try {
      orderId = PaymentCrypto.generateOrderId('QE');
      
      // Format order date (Beijing time)
      const orderDate = new Date().toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/\//g, '-');

      const params = {
        version: '1.0', // Required for JSON response
        mch_id: this.merchantId,
        mch_order_no: orderId,
        pay_type: this.getPayTypeCode(paymentData.paymentMethod),
        trade_amount: paymentData.amount.toString(),
        order_date: orderDate,
        goods_name: paymentData.subject || 'Trading Platform Recharge',
        notify_url: this.callbackUrl,
        page_url: this.returnUrl,
        mch_return_msg: `userId:${paymentData.userId}`,
        payer_phone: paymentData.userPhone || '',
        sign_type: 'MD5'
      };

      // Add bank_code only for online banking
      if (paymentData.paymentMethod === 'bank_transfer' && paymentData.bankCode) {
        params.bank_code = paymentData.bankCode;
      }

      // Generate signature (exclude sign_type and sign from signature)
      const signParams = { ...params };
      delete signParams.sign_type;
      delete signParams.sign;
      params.sign = PaymentCrypto.generateQeawapaySignature(signParams, this.collectionKey);
      
      console.log('Qeawapay Payment Params:', params);

      logger.paymentInitiated(this.gateway, orderId, paymentData.amount, {
        currency: params.currency,
        method: params.payment_method,
        userId: paymentData.userId
      });

      // Make API request to correct Qeawapay endpoint
      const response = await this.client.post('/pay/web', 
        PaymentCrypto.urlEncode(params)
      );

      console.log('Qeawapay API Response:', response.data);
      
      if (response.data.respCode === 'SUCCESS' && response.data.tradeResult === '1') {
        logger.info('Payment order created successfully', {
          orderId,
          paymentUrl: response.data.data?.payment_url
        }, this.gateway);

        return {
          success: true,
          orderId: response.data.mchOrderNo,
          paymentUrl: response.data.payInfo,
          qrCode: response.data.payInfo, // Use payInfo as QR code for UPI
          transactionId: response.data.orderNo,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
          gateway: this.gateway,
          amount: parseFloat(response.data.tradeAmount),
          currency: 'INR'
        };
      } else {
        // Handle Chinese error responses
        const errorMsg = response.data.tradeMsg || response.data.errorMsg || 'Unknown error';
        throw new Error(`Qeawapay API Error: ${errorMsg} (Code: ${response.data.respCode})`);
      }

    } catch (error) {
      logger.paymentFailed(this.gateway, orderId || 'UNKNOWN', error.message, {
        errorCode: error.response?.data?.code,
        errorMessage: error.response?.data?.message
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
      const params = {
        merchant_id: this.merchantId,
        order_id: orderId,
        timestamp: Math.floor(Date.now() / 1000),
        nonce: PaymentCrypto.generateNonce()
      };

      params.signature = PaymentCrypto.generateQeawapaySignature(params, this.collectionKey);

      const response = await this.client.post('/api/payment/query',
        PaymentCrypto.urlEncode(params)
      );

      if (response.data.code === 200) {
        const paymentData = response.data.data;
        
        logger.info('Payment status queried', {
          orderId,
          status: paymentData.status,
          amount: paymentData.amount
        }, this.gateway);

        return {
          success: true,
          status: this.mapPaymentStatus(paymentData.status),
          orderId: paymentData.order_id,
          transactionId: paymentData.transaction_id,
          amount: parseFloat(paymentData.amount),
          currency: paymentData.currency,
          paidAt: paymentData.paid_at ? new Date(paymentData.paid_at * 1000) : null,
          rawStatus: paymentData.status
        };
      } else {
        throw new Error(`Query failed: ${response.data.message}`);
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
        orderId: callbackData.order_id,
        status: callbackData.status,
        ip: callbackData.ip || 'unknown'
      });

      // Verify signature
      const isValidSignature = PaymentCrypto.verifyQeawapaySignature(
        callbackData, 
        this.collectionKey, 
        signature
      );

      logger.signatureVerification(this.gateway, callbackData.order_id, isValidSignature);

      if (!isValidSignature) {
        throw new Error('Invalid signature');
      }

      // Process the payment update
      const result = {
        orderId: callbackData.order_id,
        transactionId: callbackData.transaction_id,
        status: this.mapPaymentStatus(callbackData.status),
        amount: parseFloat(callbackData.amount),
        currency: callbackData.currency,
        paidAt: callbackData.paid_at ? new Date(callbackData.paid_at * 1000) : new Date(),
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
      const payoutId = PaymentCrypto.generateOrderId('QE_PAYOUT');
      
      // Format apply date (Beijing time)
      const applyDate = new Date().toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/\//g, '-');

      const params = {
        mch_id: this.merchantId,
        mch_transferId: payoutId,
        transfer_amount: payoutData.amount.toString(),
        apply_date: applyDate,
        bank_code: payoutData.bankCode,
        receive_name: payoutData.accountName,
        receive_account: payoutData.accountNumber,
        remark: payoutData.ifscCode, // IFSC code in remark for India
        back_url: this.callbackUrl.replace('/callback', '/payout-callback'),
        receiver_telephone: payoutData.mobile || '',
        sign_type: 'MD5'
      };

      // Generate signature (exclude sign_type and sign)
      const signParams = { ...params };
      delete signParams.sign_type;
      params.sign = PaymentCrypto.generateQeawapaySignature(signParams, this.payoutKey);

      logger.info('Payout initiated', {
        payoutId,
        amount: payoutData.amount,
        accountNumber: payoutData.accountNumber.slice(-4) // Only last 4 digits
      }, this.gateway);

      const response = await this.client.post('/pay/transfer',
        PaymentCrypto.urlEncode(params)
      );

      console.log('Qeawapay Payout Response:', response.data);

      if (response.data.respCode === 'SUCCESS') {
        return {
          success: true,
          payoutId: response.data.merTransferId,
          status: this.mapPayoutStatus(response.data.tradeResult),
          amount: parseFloat(response.data.transferAmount),
          currency: 'INR',
          estimatedTime: '1-3 business days',
          transactionId: response.data.tradeNo
        };
      } else {
        const errorMsg = response.data.errorMsg || 'Payout failed';
        throw new Error(`Qeawapay Payout Error: ${errorMsg}`);
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
   * Map Qeawapay status to standard status
   */
  mapPaymentStatus(status) {
    const statusMap = {
      'pending': 'pending',
      'processing': 'processing',
      'success': 'completed',
      'paid': 'completed',
      'failed': 'failed',
      'cancelled': 'cancelled',
      'expired': 'expired'
    };

    return statusMap[status.toLowerCase()] || 'unknown';
  }

  /**
   * Get supported payment methods
   */
  getPaymentMethods() {
    return [
      { code: 'bank_transfer', name: 'Bank Transfer', icon: '🏦' },
      { code: 'upi', name: 'UPI', icon: '📱' },
      { code: 'wallet', name: 'Digital Wallet', icon: '💳' },
      { code: 'netbanking', name: 'Net Banking', icon: '🌐' }
    ];
  }

  /**
   * Get payment type code for Qeawapay
   */
  getPayTypeCode(paymentMethod) {
    const payTypeMap = {
      'bank_transfer': '101', // Online banking
      'upi': '102', // UPI
      'wallet': '103', // Digital wallet
      'netbanking': '101' // Same as bank transfer
    };
    
    return payTypeMap[paymentMethod] || '101';
  }

  /**
   * Get supported banks
   */
  getSupportedBanks() {
    return [
      { code: 'SBI', name: 'State Bank of India' },
      { code: 'HDFC', name: 'HDFC Bank' },
      { code: 'ICICI', name: 'ICICI Bank' },
      { code: 'AXIS', name: 'Axis Bank' },
      { code: 'PNB', name: 'Punjab National Bank' },
      { code: 'BOB', name: 'Bank of Baroda' },
      { code: 'CANARA', name: 'Canara Bank' },
      { code: 'UNION', name: 'Union Bank of India' }
    ];
  }

  /**
   * Map payout status from Qeawapay
   */
  mapPayoutStatus(tradeResult) {
    const statusMap = {
      '0': 'pending',     // Transfer in progress
      '1': 'completed',   // Transfer successful
      '2': 'failed',      // Transfer failed
      '3': 'cancelled'    // Transfer cancelled
    };
    
    return statusMap[tradeResult] || 'pending';
  }
}

export default QeawapayService;
