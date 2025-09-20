/**
 * SECURE CONFIGURATION - NO CLIENT-SIDE SECRETS
 * Authentication handled server-side via Google Accounts
 * Version: 4.0 - Production Ready
 */

const SECURE_CONFIG = {
  // Replace these with your actual Google Apps Script deployment URLs
  API_URL: 'https://script.google.com/macros/s/AKfycbwZrmAHDuIcUJqzAGSCeP6B4K84_Bf5dal1XNBS9NnifzbkSdSZW38MpkOzJhNW4Do8yw/exec',
  ADMIN_API_URL: 'https://script.google.com/macros/s/AKfycbwHmvzkN2qAN076HKZch_UF-D53hhCgKdJQeRHD4KdcmHuW6KV-R32iRh-J2crVQWORCA/exec',
  
  REQUEST_TIMEOUT: 20000,
  MAX_RETRIES: 3,
  
  // Environment detection
  IS_PRODUCTION: window.location.hostname.includes('github.io'),
  DEBUG_MODE: window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1'),
  
  // Allowed origins (client-side validation)
  ALLOWED_ORIGINS: [
    'https://radiothanwy.github.io',
    'https://radiothanwy.github.io/tutor_reservation',
    'https://sudstudy.com' // Add your production domain here
  ]
};

/**
 * SECURE API CLIENT
 * Uses JSONP-only approach to bypass CORS issues completely
 */
class SecureApiClient {
  constructor(config) {
    this.config = config;
    this.requestId = 0;
    this.pendingRequests = new Map();
    
    console.log('SecureApiClient v4.0 initialized');
    
    if (!this.isConfigValid()) {
      throw new Error('Invalid configuration - check your Google Apps Script URLs');
    }
  }

  isConfigValid() {
    return Boolean(
      this.config.API_URL &&
      this.config.API_URL.startsWith('https://script.google.com/macros/s/') &&
      this.config.ADMIN_API_URL &&
      this.config.ADMIN_API_URL.startsWith('https://script.google.com/macros/s/')
    );
  }

  async submitForm(formData) {
    console.log('Submitting form data:', Object.keys(formData));
    
    // Validate required fields
    const required = ['firstName', 'lastName', 'email', 'phone', 'grade', 'englishLevel', 'preferredDays', 'preferredTime', 'sessionLength'];
    for (const field of required) {
      if (!formData[field] || !formData[field].toString().trim()) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    const params = new URLSearchParams({
      action: 'submitform',
      origin: window.location.origin,
      firstName: this._sanitize(formData.firstName),
      lastName: this._sanitize(formData.lastName),
      email: this._sanitize(formData.email),
      phone: this._sanitize(formData.phone),
      grade: this._sanitize(formData.grade),
      gender: this._sanitize(formData.gender),
      englishLevel: this._sanitize(formData.englishLevel),
      preferredDays: this._sanitize(formData.preferredDays),
      preferredTime: this._sanitize(formData.preferredTime),
      sessionLength: this._sanitize(formData.sessionLength),
      gpa: this._sanitize(formData.gpa),
      learningGoals: this._sanitize(formData.learningGoals, 200),
      referral: this._sanitize(formData.referral),
      userAgent: navigator.userAgent.substring(0, 100),
      formTime: formData.formTime || '',
      timestamp: new Date().toISOString()
    });

    return this._jsonpRequest(this.config.API_URL, params);
  }

  async queryReservation(reservationId) {
    const clean = String(reservationId || '').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 15);
    
    if (!clean) {
      throw new Error('Invalid reservation ID format');
    }
    
    const params = new URLSearchParams({
      action: 'queryreservation',
      origin: window.location.origin,
      reservationId: clean
    });
    
    return this._jsonpRequest(this.config.API_URL, params);
  }

  async getReservations() {
    const params = new URLSearchParams({
      action: 'getreservations',
      origin: window.location.origin
    });
    
    return this._jsonpRequest(this.config.ADMIN_API_URL, params);
  }

  async updateStatus(reservationId, newStatus) {
    const validStatuses = ['Pending', 'Accepted', 'Rejected'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error('Invalid status. Must be: ' + validStatuses.join(', '));
    }
    
    const params = new URLSearchParams({
      action: 'updatestatus',
      origin: window.location.origin,
      reservationId: reservationId,
      status: newStatus
    });
    
    return this._jsonpRequest(this.config.ADMIN_API_URL, params);
  }

  async deleteReservation(reservationId) {
    const params = new URLSearchParams({
      action: 'deletereservation',
      origin: window.location.origin,
      reservationId: reservationId
    });
    
    return this._jsonpRequest(this.config.ADMIN_API_URL, params);
  }

  async healthCheck() {
    const params = new URLSearchParams({
      action: 'health',
      origin: window.location.origin
    });
    
    return this._jsonpRequest(this.config.API_URL, params);
  }

  async debugInfo() {
    const params = new URLSearchParams({
      action: 'debug',
      origin: window.location.origin
    });
    
    return this._jsonpRequest(this.config.ADMIN_API_URL, params);
  }

  // JSONP implementation with enhanced error handling
  _jsonpRequest(baseUrl, params) {
    return new Promise((resolve, reject) => {
      const requestId = ++this.requestId;
      const callbackName = `jsonpCallback_${requestId}_${Date.now()}`;
      
      // Add callback parameter
      params.set('callback', callbackName);
      const url = `${baseUrl}?${params.toString()}`;
      
      console.log(`JSONP Request #${requestId}:`, url.substring(0, 150) + '...');
      
      let script, timeoutId;

      // Set up timeout
      timeoutId = setTimeout(() => {
        this._cleanupRequest(callbackName, script, timeoutId, requestId);
        reject(new Error(`Request timeout after ${this.config.REQUEST_TIMEOUT}ms`));
      }, this.config.REQUEST_TIMEOUT);

      // Set up success callback
      window[callbackName] = (response) => {
        this._cleanupRequest(callbackName, script, timeoutId, requestId);
        
        console.log(`JSONP Response #${requestId}:`, response);
        
        if (response && response.success !== false) {
          resolve(response);
        } else {
          reject(new Error(response && response.error ? response.error : 'Request failed'));
        }
      };

      // Create and load script
      script = document.createElement('script');
      script.src = url;
      script.onerror = () => {
        this._cleanupRequest(callbackName, script, timeoutId, requestId);
        reject(new Error('Failed to load script - check Google Apps Script deployment'));
      };
      
      // Track pending request
      this.pendingRequests.set(requestId, { callbackName, script, timeoutId });
      
      document.head.appendChild(script);
    });
  }

  // Helper methods
  _sanitize(value, maxLength = 100) {
    if (!value) return '';
    return String(value).trim().substring(0, maxLength);
  }

  _cleanupRequest(callbackName, script, timeoutId, requestId) {
    try { clearTimeout(timeoutId); } catch (e) {}
    try { delete window[callbackName]; } catch (e) {}
    try { 
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    } catch (e) {}
    try { this.pendingRequests.delete(requestId); } catch (e) {}
  }

  // Cleanup all pending requests
  cleanup() {
    this.pendingRequests.forEach((request, id) => {
      this._cleanupRequest(request.callbackName, request.script, request.timeoutId, id);
    });
    this.pendingRequests.clear();
  }
}

/**
 * SECURE FORM HANDLER
 */
class SecureFormHandler {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.startTime = Date.now();
    this.submissionInProgress = false;
  }

  async submitForm(formData) {
    if (this.submissionInProgress) {
      throw new Error('Submission already in progress');
    }

    try {
      this.submissionInProgress = true;
      
      const formTime = Math.floor((Date.now() - this.startTime) / 1000);
      const submissionData = {
        ...formData,
        formTime: formTime + ' seconds',
        timestamp: new Date().toISOString()
      };

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(submissionData.email)) {
        throw new Error('Invalid email format');
      }

      const response = await this.apiClient.submitForm(submissionData);
      
      if (response.success) {
        return {
          success: true,
          reservationId: response.reservationId,
          studentName: `${formData.firstName} ${formData.lastName}`
        };
      } else {
        throw new Error(response.error || 'Submission failed');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      throw new Error('Failed to submit reservation: ' + error.message);
    } finally {
      this.submissionInProgress = false;
    }
  }
}

/**
 * NOTIFICATION SYSTEM
 */
class SecureNotificationSystem {
  static show(message, type = 'info', duration = 5000) {
    // Remove existing notifications of the same type
    document.querySelectorAll(`.secure-notification--${type}`).forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `secure-notification secure-notification--${type}`;
    notification.textContent = String(message).slice(0, 300);
    
    // Styles
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: '9999',
      padding: '15px 20px',
      color: '#fff',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: '500',
      fontFamily: 'Montserrat, sans-serif',
      boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
      maxWidth: '300px',
      wordWrap: 'break-word',
      animation: 'slideInRight 0.4s ease-out',
      background: type === 'success' ? '#28a745' :
                  type === 'error' ? '#dc3545' :
                  type === 'warning' ? '#ffc107' :
                  type === 'info' ? '#17a2b8' : '#6c757d'
    });
    
    // Add close button
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = 'float: right; margin-left: 15px; cursor: pointer; font-weight: bold; font-size: 18px;';
    closeBtn.onclick = () => notification.remove();
    notification.appendChild(closeBtn);
    
    document.body.appendChild(notification);
    
    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, duration);
    }
  }
}

/**
 * SECURITY UTILITIES
 */
const SecurityUtils = {
  validateEnvironment() {
    const issues = [];
    
    // Check configuration
    if (!SECURE_CONFIG.API_URL) issues.push('API URL not configured');
    if (!SECURE_CONFIG.ADMIN_API_URL) issues.push('Admin API URL not configured');
    
    // Check origin
    const currentOrigin = window.location.origin;
    const isOriginAllowed = SECURE_CONFIG.ALLOWED_ORIGINS.some(origin => 
      currentOrigin === origin || currentOrigin.startsWith(origin + '/')
    );
    
    if (!isOriginAllowed && SECURE_CONFIG.IS_PRODUCTION) {
      issues.push(`Origin not in whitelist: ${currentOrigin}`);
    }
    
    // Check HTTPS in production
    if (SECURE_CONFIG.IS_PRODUCTION && window.location.protocol !== 'https:') {
      issues.push('HTTPS required in production');
    }
    
    return { 
      isValid: issues.length === 0, 
      issues,
      origin: currentOrigin,
      isProduction: SECURE_CONFIG.IS_PRODUCTION
    };
  },

  logSecurityEvent(event, details) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event: event,
      origin: window.location.origin,
      userAgent: navigator.userAgent.substring(0, 100),
      details: details
    };
    
    console.log('Security Event:', logEntry);
    
    // In production, you might want to send this to a logging service
    if (SECURE_CONFIG.IS_PRODUCTION && event === 'security_violation') {
      // Could send to external logging service here
    }
  }
};

/**
 * INITIALIZATION AND GLOBAL SETUP
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing Tutor Reservation System v4.0...');
  
  // Add notification styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .secure-notification { animation: slideInRight 0.4s ease-out; }
  `;
  document.head.appendChild(style);
  
  // Validate environment
  const env = SecurityUtils.validateEnvironment();
  if (!env.isValid) {
    console.warn('Environment validation issues:', env.issues);
    
    if (env.isProduction) {
      SecurityUtils.logSecurityEvent('environment_validation_failed', env);
      SecureNotificationSystem.show('System configuration warning - some features may be limited', 'warning', 8000);
    }
  }
  
  try {
    // Initialize secure components
    window.secureApiClient = new SecureApiClient(SECURE_CONFIG);
    window.secureFormHandler = new SecureFormHandler(window.secureApiClient);
    
    console.log('Secure configuration loaded successfully');
    SecurityUtils.logSecurityEvent('system_initialized', { version: '4.0' });
    
    // Run health check in debug mode
    if (SECURE_CONFIG.DEBUG_MODE) {
      window.secureApiClient.healthCheck()
        .then(response => {
          console.log('Health check result:', response);
          if (response.success) {
            SecureNotificationSystem.show('System connection verified', 'success', 3000);
          } else {
            SecureNotificationSystem.show('Health check failed: ' + (response.error || 'Unknown error'), 'warning', 8000);
          }
        })
        .catch(error => {
          console.error('Health check error:', error);
          SecureNotificationSystem.show('Connection test failed: ' + error.message, 'error', 8000);
        });
    }
    
  } catch (error) {
    console.error('Initialization error:', error);
    SecurityUtils.logSecurityEvent('initialization_failed', { error: error.message });
    SecureNotificationSystem.show('System initialization failed: ' + error.message, 'error', 0);
  }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.secureApiClient) {
    window.secureApiClient.cleanup();
  }
});

// Security monitoring
if (SECURE_CONFIG.IS_PRODUCTION) {
  // Monitor for potential security issues
  window.addEventListener('error', (event) => {
    if (event.error && event.error.message.includes('script')) {
      SecurityUtils.logSecurityEvent('script_error', {
        message: event.error.message,
        filename: event.filename,
        lineno: event.lineno
      });
    }
  });
}