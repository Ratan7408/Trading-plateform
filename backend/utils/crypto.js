import crypto from 'crypto';

/**
 * Payment Gateway Crypto Utilities - CORRECTED VERSION
 * Handles signature generation and verification for WatchGLB
 * Based on official documentation requirements
 */

export class PaymentCrypto {
  /**
   * Generate MD5 hash
   */
  static md5(data) {
    return crypto.createHash('md5').update(data, 'utf8').digest('hex');
  }

  /**
   * Generate SHA256 hash
   */
  static sha256(data) {
    return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
  }

  /**
   * Generate HMAC SHA256 signature
   */
  static hmacSha256(data, key) {
    return crypto.createHmac('sha256', key).update(data, 'utf8').digest('hex');
  }


  /**
   * Generate WatchGLB signature
   * Format: SHA256(param1=value1&param2=value2&...&key=secret_key)
   * Rules:
   * - Exclude 'sign', 'signature' fields
   * - Exclude empty values
   * - Sort parameters alphabetically
   * - Create key=value pairs with & separators
   * - Add secret key at the end
   * - SHA256 hash and convert to uppercase
   */
  static generateWatchGLBSignature(params, secretKey) {
    try {
      console.log('[WatchGLB] Original params:', params);
      
      // Remove signature field, sign_type, and empty values
      const filteredParams = {};
      Object.keys(params).forEach(key => {
        const value = params[key];
        if (key !== 'sign' && key !== 'signature' && key !== 'sign_type' && 
            value !== '' && value !== null && value !== undefined) {
          filteredParams[key] = String(value); // Ensure all values are strings
        }
      });

      console.log('[WatchGLB] Filtered params:', filteredParams);

      // Sort parameters alphabetically by key
      const sortedKeys = Object.keys(filteredParams).sort();
      console.log('[WatchGLB] Sorted keys:', sortedKeys);
      
      // Create query string with key=value pairs
      const queryString = sortedKeys
        .map(key => `${key}=${filteredParams[key]}`)
        .join('&');
      
      // Add secret key at the end
      const signString = `${queryString}&key=${secretKey}`;
      
      console.log('[WatchGLB] Sign string:', signString);
      
          // Generate MD5 hash and convert to UPPERCASE per latest spec
          const signature = this.md5(signString).toUpperCase();
      console.log('[WatchGLB] Generated signature:', signature);
      
      return signature;
    } catch (error) {
      console.error('Error generating WatchGLB signature:', error);
      throw new Error('Failed to generate WatchGLB signature');
    }
  }

  /**
   * Verify WatchGLB signature
   */
  static verifyWatchGLBSignature(params, secretKey, receivedSignature) {
    try {
      const expectedSignature = this.generateWatchGLBSignature(params, secretKey);
      const isValid = expectedSignature === receivedSignature.toUpperCase();
      
      console.log('[WatchGLB] Signature verification:', {
        expected: expectedSignature,
        received: receivedSignature.toUpperCase(),
        isValid
      });
      
      return isValid;
    } catch (error) {
      console.error('Error verifying WatchGLB signature:', error);
      return false;
    }
  }

  /**
   * Generate random order ID
   */
  static generateOrderId(prefix = 'ORD') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  /**
   * Generate random nonce
   */
  static generateNonce(length = 16) {
    return crypto.randomBytes(length).toString('hex').toUpperCase();
  }

  /**
   * Validate timestamp (within 5 minutes)
   */
  static validateTimestamp(timestamp, toleranceMs = 300000) {
    const now = Date.now();
    const timestampMs = parseInt(timestamp) * 1000; // Convert to milliseconds if needed
    const diff = Math.abs(now - timestampMs);
    return diff <= toleranceMs;
  }

  /**
   * URL encode parameters for form submission
   */
  static urlEncode(params) {
    return Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
  }

  /**
   * Safe string comparison to prevent timing attacks
   */
  static safeCompare(a, b) {
    if (a.length !== b.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }

  /**
   * Generate test signature for debugging
   */
  static generateTestSignature(gateway, params, secretKey) {
    console.log(`[${gateway.toUpperCase()}] Testing signature generation...`);
    
    if (gateway.toLowerCase() === 'watchglb') {
      return this.generateWatchGLBSignature(params, secretKey);
    } else {
      throw new Error(`Unknown gateway: ${gateway}. Only WatchGLB is supported.`);
    }
  }

  /**
   * Verify webhook signature from HTTP headers
   */
  static verifyWebhookSignature(gateway, params, secretKey, signature, headers = {}) {
    const signatureToVerify = signature || 
                             headers['x-signature'] || 
                             headers['signature'] || 
                             params.sign || 
                             params.signature;

    if (!signatureToVerify) {
      console.warn(`[${gateway}] No signature found in request`);
      return false;
    }

    if (gateway.toLowerCase() === 'watchglb') {
      return this.verifyWatchGLBSignature(params, secretKey, signatureToVerify);
    } else {
      console.error(`Unknown gateway for signature verification: ${gateway}. Only WatchGLB is supported.`);
      return false;
    }
  }

  /**
   * Format currency amount to 2 decimal places
   */
  static formatAmount(amount) {
    return parseFloat(amount).toFixed(2);
  }

  /**
   * Generate callback response for payment gateways
   */
  static generateCallbackResponse(gateway, success = true) {
    if (gateway.toLowerCase() === 'watchglb') {
      return success ? 'SUCCESS' : 'FAIL';
    }
    return success ? 'OK' : 'ERROR';
  }
}

export default PaymentCrypto;