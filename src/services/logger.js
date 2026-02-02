// src/services/logger.js

/**
 * Logging service for tracking errors and events
 * In production, this would send logs to a backend service
 */

const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 100; // Keep last 100 logs in memory
  }

  /**
   * Create a structured log entry
   */
  createLogEntry(level, message, context = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...context,
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    };

    // Add to in-memory logs
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output for development
    const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
    console[consoleMethod](`[${level.toUpperCase()}]`, message, context);

    // In production, send to backend
    if (level === LOG_LEVELS.ERROR) {
      this.sendToBackend(entry);
    }

    return entry;
  }

  /**
   * Log error with full context
   */
  error(message, error, additionalContext = {}) {
    const context = {
      ...additionalContext,
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        code: error?.code,
        status: error?.status,
        response: error?.response?.data
      }
    };

    return this.createLogEntry(LOG_LEVELS.ERROR, message, context);
  }

  /**
   * Log warning
   */
  warn(message, context = {}) {
    return this.createLogEntry(LOG_LEVELS.WARN, message, context);
  }

  /**
   * Log info
   */
  info(message, context = {}) {
    return this.createLogEntry(LOG_LEVELS.INFO, message, context);
  }

  /**
   * Log debug information
   */
  debug(message, context = {}) {
    return this.createLogEntry(LOG_LEVELS.DEBUG, message, context);
  }

  /**
   * Get all logs
   */
  getLogs(level = null) {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  /**
   * Download logs as JSON file
   */
  downloadLogs() {
    const dataStr = JSON.stringify(this.logs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-assistant-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Send log to backend (placeholder for production)
   */
  async sendToBackend(logEntry) {
    // In production, send to your logging service
    // Example: await fetch('/api/logs', { method: 'POST', body: JSON.stringify(logEntry) })
    
    // For now, just store in localStorage as backup
    try {
      const existingLogs = JSON.parse(localStorage.getItem('error_logs') || '[]');
      existingLogs.push(logEntry);
      
      // Keep only last 50 error logs in localStorage
      if (existingLogs.length > 50) {
        existingLogs.shift();
      }
      
      localStorage.setItem('error_logs', JSON.stringify(existingLogs));
    } catch (e) {
      console.error('Failed to store error log:', e);
    }
  }

  /**
   * Clear all logs
   */
  clear() {
    this.logs = [];
    localStorage.removeItem('error_logs');
  }
}

// Export singleton instance
export const logger = new Logger();

// Export user-friendly error messages
export const USER_FRIENDLY_ERRORS = {
  // API Errors
  API_KEY_INVALID: {
    title: 'API Key Issue',
    message: 'Your Anthropic API key appears to be invalid. Please check your API key in the .env file.',
    action: 'Verify API Key'
  },
  API_KEY_MISSING: {
    title: 'API Key Missing',
    message: 'No API key found. Please add your Anthropic API key to the .env file.',
    action: 'Add API Key'
  },
  API_RATE_LIMIT: {
    title: 'Rate Limit Exceeded',
    message: 'Too many requests. Please wait a moment before trying again.',
    action: 'Try Again Later'
  },
  API_INSUFFICIENT_CREDITS: {
    title: 'Insufficient Credits',
    message: 'Your Anthropic account has insufficient credits. Please add credits to continue.',
    action: 'Add Credits'
  },
  
  // Network Errors
  NETWORK_ERROR: {
    title: 'Connection Issue',
    message: 'Unable to connect to the service. Please check your internet connection.',
    action: 'Retry'
  },
  TIMEOUT: {
    title: 'Request Timeout',
    message: 'The request took too long. Please try again.',
    action: 'Retry'
  },
  
  // File Errors
  FILE_TOO_LARGE: {
    title: 'File Too Large',
    message: 'The invoice image is too large. Please use an image under 5MB.',
    action: 'Choose Smaller File'
  },
  INVALID_FILE_TYPE: {
    title: 'Invalid File Type',
    message: 'Please upload a valid image file (JPG, PNG, or PDF).',
    action: 'Choose Different File'
  },
  FILE_READ_ERROR: {
    title: 'File Read Error',
    message: 'Unable to read the file. Please try uploading it again.',
    action: 'Try Again'
  },
  
  // Processing Errors
  EXTRACTION_FAILED: {
    title: 'Extraction Failed',
    message: 'Unable to extract data from the invoice. The image may be unclear or not an invoice.',
    action: 'Try Different Image'
  },
  NOT_AN_INVOICE: {
    title: 'Not an Invoice',
    message: 'This document doesn\'t appear to be an invoice. Please upload a valid invoice image.',
    action: 'Upload Invoice'
  },
  LOW_QUALITY_IMAGE: {
    title: 'Poor Image Quality',
    message: 'The image quality is too low to extract reliable data. Please upload a clearer image.',
    action: 'Upload Better Image'
  },
  
  // Generic
  UNKNOWN_ERROR: {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again or contact support if the issue persists.',
    action: 'Try Again'
  }
};

/**
 * Convert technical error to user-friendly error
 */
export function getUserFriendlyError(error, context = {}) {
  // Check for API authentication errors
  if (error?.message?.includes('authentication_error') || error?.message?.includes('invalid x-api-key')) {
    return USER_FRIENDLY_ERRORS.API_KEY_INVALID;
  }
  
  if (error?.message?.includes('apiKey') || error?.message?.includes('authToken')) {
    return USER_FRIENDLY_ERRORS.API_KEY_MISSING;
  }
  
  // Check for rate limiting
  if (error?.status === 429 || error?.message?.includes('rate_limit')) {
    return USER_FRIENDLY_ERRORS.API_RATE_LIMIT;
  }
  
  // Check for insufficient credits
  if (error?.message?.includes('insufficient_quota') || error?.message?.includes('billing')) {
    return USER_FRIENDLY_ERRORS.API_INSUFFICIENT_CREDITS;
  }
  
  // Check for network errors
  if (error?.message?.includes('network') || error?.message?.includes('fetch failed')) {
    return USER_FRIENDLY_ERRORS.NETWORK_ERROR;
  }
  
  // Check for timeout
  if (error?.message?.includes('timeout')) {
    return USER_FRIENDLY_ERRORS.TIMEOUT;
  }
  
  // Check context for specific errors
  if (context.type === 'file_too_large') {
    return USER_FRIENDLY_ERRORS.FILE_TOO_LARGE;
  }
  
  if (context.type === 'invalid_file_type') {
    return USER_FRIENDLY_ERRORS.INVALID_FILE_TYPE;
  }
  
  if (context.documentType && context.documentType !== 'invoice') {
    return USER_FRIENDLY_ERRORS.NOT_AN_INVOICE;
  }
  
  if (context.extractionQuality === 'low') {
    return USER_FRIENDLY_ERRORS.LOW_QUALITY_IMAGE;
  }
  
  // Default error
  return USER_FRIENDLY_ERRORS.UNKNOWN_ERROR;
}
