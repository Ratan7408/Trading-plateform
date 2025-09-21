import fs from 'fs';
import path from 'path';

/**
 * Payment Logger Utility
 * Handles secure logging for payment operations
 */

export class PaymentLogger {
  constructor() {
    this.logDir = 'logs';
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatLog(level, message, data = null, gateway = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      gateway,
      message,
      ...(data && { data: this.sanitizeData(data) })
    };
    
    return JSON.stringify(logEntry);
  }

  sanitizeData(data) {
    const sensitive = ['password', 'key', 'secret', 'token', 'signature', 'sign'];
    const sanitized = { ...data };
    
    Object.keys(sanitized).forEach(key => {
      if (sensitive.some(s => key.toLowerCase().includes(s))) {
        sanitized[key] = '***REDACTED***';
      }
    });
    
    return sanitized;
  }

  writeLog(filename, content) {
    const filepath = path.join(this.logDir, filename);
    const logLine = content + '\n';
    
    fs.appendFileSync(filepath, logLine, 'utf8');
  }

  info(message, data = null, gateway = null) {
    const log = this.formatLog('info', message, data, gateway);
    console.log(log);
    this.writeLog('payments.log', log);
  }

  error(message, error = null, gateway = null) {
    const errorData = error ? {
      message: error.message,
      stack: error.stack,
      ...(error.response && { response: error.response.data })
    } : null;
    
    const log = this.formatLog('error', message, errorData, gateway);
    console.error(log);
    this.writeLog('payments.log', log);
  }

  warn(message, data = null, gateway = null) {
    const log = this.formatLog('warn', message, data, gateway);
    console.warn(log);
    this.writeLog('payments.log', log);
  }

  debug(message, data = null, gateway = null) {
    if (process.env.NODE_ENV === 'development') {
      const log = this.formatLog('debug', message, data, gateway);
      console.debug(log);
      this.writeLog('payments.log', log);
    }
  }

  // Payment specific logging methods
  paymentInitiated(gateway, orderId, amount, data) {
    this.info(`Payment initiated`, {
      orderId,
      amount,
      currency: data.currency || 'INR',
      method: data.method
    }, gateway);
  }

  paymentCompleted(gateway, orderId, status, data) {
    this.info(`Payment ${status}`, {
      orderId,
      transactionId: data.transactionId,
      amount: data.amount,
      status
    }, gateway);
  }

  paymentFailed(gateway, orderId, reason, data) {
    this.error(`Payment failed`, {
      orderId,
      reason,
      errorCode: data.errorCode,
      errorMessage: data.errorMessage
    }, gateway);
  }

  webhookReceived(gateway, data) {
    this.info(`Webhook received`, {
      orderId: data.orderId || data.order_id,
      status: data.status,
      ip: data.ip
    }, gateway);
  }

  signatureVerification(gateway, orderId, isValid) {
    if (isValid) {
      this.info(`Signature verification successful`, { orderId }, gateway);
    } else {
      this.warn(`Signature verification failed`, { orderId }, gateway);
    }
  }
}

export default new PaymentLogger();
