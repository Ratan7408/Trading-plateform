import crypto from 'crypto';

/**
 * Payment Gateway Crypto Utilities
 * Handles signature generation and verification for both Qeawapay and WatchGLB
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
   * Generate Qeawapay signature
   * Format: MD5(param1=value1&param2=value2&...&key=secret_key)
   */
  static generateQeawapaySignature(params, secretKey) {
    try {
      // Remove signature, sign, sign_type and empty values
      const filteredParams = {};
      Object.keys(params).forEach(key => {
        if (key !== 'signature' && key !== 'sign' && key !== 'sign_type' && 
            params[key] !== '' && params[key] !== null && params[key] !== undefined) {
          filteredParams[key] = params[key];
        }
      });

      // Sort parameters alphabetically
      const sortedKeys = Object.keys(filteredParams).sort();
      
      // Create query string
      const queryString = sortedKeys
        .map(key => `${key}=${filteredParams[key]}`)
        .join('&');
      
      // Append secret key
      const signString = `${queryString}&key=${secretKey}`;
      
      console.log('Qeawapay Sign String:', signString);
      
      // Generate MD5 hash and convert to uppercase
      return this.md5(signString).toUpperCase();
    } catch (error) {
      console.error('Error generating Qeawapay signature:', error);
      throw new Error('Failed to generate Qeawapay signature');
    }
  }

  /**
   * Verify Qeawapay signature
   */
  static verifyQeawapaySignature(params, secretKey, receivedSignature) {
    try {
      const expectedSignature = this.generateQeawapaySignature(params, secretKey);
      return expectedSignature === receivedSignature.toUpperCase();
    } catch (error) {
      console.error('Error verifying Qeawapay signature:', error);
      return false;
    }
  }

  /**
   * Generate WatchGLB signature
   * Format: SHA256(param1value1param2value2...key)
   */
  static generateWatchGLBSignature(params, secretKey) {
    try {
      // Remove signature and empty values
      const filteredParams = {};
      Object.keys(params).forEach(key => {
        if (key !== 'signature' && key !== 'sign' && params[key] !== '' && params[key] !== null && params[key] !== undefined) {
          filteredParams[key] = params[key];
        }
      });

      // Sort parameters alphabetically
      const sortedKeys = Object.keys(filteredParams).sort();
      
      // Create concatenated string (no separators)
      const signString = sortedKeys
        .map(key => `${key}${filteredParams[key]}`)
        .join('') + secretKey;
      
      console.log('WatchGLB Sign String:', signString);
      
      // Generate SHA256 hash and convert to uppercase
      return this.sha256(signString).toUpperCase();
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
      return expectedSignature === receivedSignature.toUpperCase();
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
    const diff = Math.abs(now - parseInt(timestamp));
    return diff <= toleranceMs;
  }

  /**
   * URL encode parameters
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
}

export default PaymentCrypto;
