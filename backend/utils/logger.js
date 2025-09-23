import fs from 'fs';
import path from 'path';

/**
 * Payment Logger Utility
 * Provides structured logging for payment operations
 */

class PaymentLogger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.logFile = process.env.LOG_FILE_PATH || './logs/payments.log';
    
    // Ensure logs directory exists
    this.ensureLogDirectory();
    
    // Log levels with numeric values for comparison
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
  }

  ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  shouldLog(level) {
    return this.levels[level] <= this.levels[this.logLevel];
  }

  formatLogEntry(level, message, data = {}, gateway = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      gateway,
      ...data,
      pid: process.pid,
      hostname: process.env.HOSTNAME || 'localhost'
    };

    return JSON.stringify(logEntry);
  }

  writeToFile(logEntry) {
    try {
      fs.appendFileSync(this.logFile, logEntry + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  writeToConsole(level, logEntry) {
    const parsedEntry = JSON.parse(logEntry);
    const coloredMessage = this.colorizeConsoleOutput(level, parsedEntry);
    console.log(coloredMessage);
  }

  colorizeConsoleOutput(level, entry) {
    const colors = {
      error: '\x1b[31m',   // Red
      warn: '\x1b[33m',    // Yellow
      info: '\x1b[36m',    // Cyan
      debug: '\x1b[37m'    // White
    };
    const reset = '\x1b[0m';
    const color = colors[level] || colors.info;

    return `${color}[${entry.timestamp}] ${entry.level}${entry.gateway ? ` [${entry.gateway.toUpperCase()}]` : ''}: ${entry.message}${reset}${
      Object.keys(entry).length > 4 ? ' ' + JSON.stringify(entry, null, 2) : ''
    }`;
  }

  log(level, message, data = {}, gateway = null) {
    if (!this.shouldLog(level)) return;

    const logEntry = this.formatLogEntry(level, message, data, gateway);
    
    // Always write to console in development
    if (process.env.NODE_ENV === 'development') {
      this.writeToConsole(level, logEntry);
    }
    
    // Write to file if configured
    if (this.logFile && process.env.NODE_ENV === 'production') {
      this.writeToFile(logEntry);
    }
  }

  // Standard log levels
  error(message, error = null, gateway = null) {
    const errorData = error ? {
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code,
        name: error.name
      }
    } : {};
    
    this.log('error', message, errorData, gateway);
  }

  warn(message, data = {}, gateway = null) {
    this.log('warn', message, data, gateway);
  }

  info(message, data = {}, gateway = null) {
    this.log('info', message, data, gateway);
  }

  debug(message, data = {}, gateway = null) {
    this.log('debug', message, data, gateway);
  }

  // Payment-specific logging methods
  paymentInitiated(gateway, orderId, amount, metadata = {}) {
    this.info('Payment initiated', {
      orderId,
      amount,
      currency: metadata.currency || 'INR',
      paymentMethod: metadata.method,
      userId: metadata.userId,
      ...metadata
    }, gateway);
  }

  paymentCompleted(gateway, orderId, status, data = {}) {
    this.info('Payment completed', {
      orderId,
      status,
      transactionId: data.transactionId,
      amount: data.amount,
      currency: data.currency || 'INR',
      paidAt: data.paidAt
    }, gateway);
  }

  paymentFailed(gateway, orderId, reason, metadata = {}) {
    this.error('Payment failed', {
      orderId,
      reason,
      errorCode: metadata.errorCode,
      errorMessage: metadata.errorMessage,
      ...metadata
    }, gateway);
  }

  webhookReceived(gateway, data = {}) {
    this.info('Webhook received', {
      orderId: data.orderId,
      status: data.status,
      ip: data.ip,
      userAgent: data.userAgent,
      ...data
    }, gateway);
  }

  signatureVerification(gateway, orderId, isValid, details = {}) {
    if (isValid) {
      this.info('Signature verified successfully', {
        orderId,
        ...details
      }, gateway);
    } else {
      this.warn('Signature verification failed', {
        orderId,
        ...details
      }, gateway);
    }
  }

  payoutInitiated(gateway, payoutId, amount, metadata = {}) {
    this.info('Payout initiated', {
      payoutId,
      amount,
      currency: metadata.currency || 'INR',
      accountNumber: metadata.accountNumber,
      bankCode: metadata.bankCode,
      userId: metadata.userId
    }, gateway);
  }

  payoutCompleted(gateway, payoutId, status, data = {}) {
    this.info('Payout completed', {
      payoutId,
      status,
      transactionId: data.transactionId,
      amount: data.amount,
      currency: data.currency || 'INR',
      processedAt: data.processedAt
    }, gateway);
  }

  payoutFailed(gateway, payoutId, reason, metadata = {}) {
    this.error('Payout failed', {
      payoutId,
      reason,
      errorCode: metadata.errorCode,
      errorMessage: metadata.errorMessage,
      ...metadata
    }, gateway);
  }

  balanceQuery(gateway, balance, currency = 'INR') {
    this.info('Balance queried', {
      balance,
      currency,
      timestamp: new Date().toISOString()
    }, gateway);
  }

  configurationError(gateway, message, details = {}) {
    this.error('Configuration error', {
      gateway,
      message,
      ...details
    }, gateway);
  }

  rateLimitExceeded(type, ip, userId = null, metadata = {}) {
    this.warn('Rate limit exceeded', {
      type, // 'payment' or 'payout'
      ip,
      userId,
      userAgent: metadata.userAgent,
      ...metadata
    });
  }

  securityAlert(type, message, data = {}) {
    this.error('Security alert', {
      alertType: type,
      message,
      ip: data.ip,
      userId: data.userId,
      userAgent: data.userAgent,
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  // Database operation logging
  databaseOperation(operation, model, result, metadata = {}) {
    this.debug('Database operation', {
      operation, // 'create', 'update', 'find', 'delete'
      model,
      success: result.success || true,
      recordId: result.id || result._id,
      ...metadata
    });
  }

  // API request/response logging
  apiRequest(gateway, endpoint, method, params, response, duration) {
    this.debug('API request completed', {
      endpoint,
      method,
      requestParams: this.sanitizeParams(params),
      responseCode: response.status || response.code,
      responseSuccess: response.success,
      duration: `${duration}ms`
    }, gateway);
  }

  // Sanitize sensitive data from logs
  sanitizeParams(params) {
    const sensitiveFields = [
      'sign', 'signature', 'key', 'secret', 'password', 
      'token', 'accountNumber', 'cardNumber', 'cvv'
    ];
    
    const sanitized = { ...params };
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  // Performance monitoring
  performanceMetric(operation, duration, metadata = {}) {
    this.debug('Performance metric', {
      operation,
      duration: `${duration}ms`,
      ...metadata
    });
  }

  // Audit trail for sensitive operations
  auditTrail(action, userId, details = {}) {
    this.info('Audit trail', {
      action,
      userId,
      timestamp: new Date().toISOString(),
      ip: details.ip,
      userAgent: details.userAgent,
      ...details
    });
  }
}

// Create singleton instance
const logger = new PaymentLogger();

export default logger;