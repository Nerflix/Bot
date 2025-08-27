// Updated API Utils - frontend/src/utils/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Store the detected public IP globally
let detectedPublicIP = null;

/**
 * Get public IP from external service
 */
const getPublicIPFromService = async () => {
  try {
    const services = [
      'https://api.ipify.org?format=json',
      'https://ipapi.co/json/',
      'https://httpbin.org/ip'
    ];
    
    for (const service of services) {
      try {
        const response = await fetch(service, { timeout: 5000 });
        const data = await response.json();
        
        const ip = data.ip || data.origin || data.query;
        if (ip) {
          detectedPublicIP = ip;
          return ip;
        }
      } catch (serviceError) {
        continue;
      }
    }
    
    throw new Error('All IP services failed');
    
  } catch (error) {
    return '127.0.0.1';
  }
};

/**
 * Enhanced fetch with proper IP forwarding
 */
const apiRequest = async (endpoint, options = {}) => {
  try {
    if (!detectedPublicIP) {
      detectedPublicIP = await getPublicIPFromService();
    }
    
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Client-Public-IP': detectedPublicIP,
      ...options.headers
    };
    
    const requestOptions = {
      ...options,
      headers
    };
    
    const response = await fetch(url, requestOptions);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }
    
    return data;
    
  } catch (error) {
    throw error;
  }
};

/**
 * Test API connection
 */
export const testConnection = async () => {
  try {
    return await apiRequest('/test');
  } catch (error) {
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
};

/**
 * Get public IP
 */
export const getPublicIP = async () => {
  try {
    const result = await apiRequest('/ip');
    if (result.success && result.ip && result.ip !== '127.0.0.1' && result.ip !== '::1') {
      detectedPublicIP = result.ip;
      return result.ip;
    }
    
    const publicIP = await getPublicIPFromService();
    detectedPublicIP = publicIP;
    return publicIP;
    
  } catch (error) {
    try {
      return await getPublicIPFromService();
    } catch (fallbackError) {
      return '127.0.0.1';
    }
  }
};

/**
 * Get or create session
 */
export const getCurrentSession = async () => {
  try {
    return await apiRequest('/session/current');
  } catch (error) {
    throw error;
  }
};

/**
 * Submit bot details - now creates mining session
 */
export const submitBotDetails = async (botData) => {
  try {
    if (!detectedPublicIP) {
      detectedPublicIP = await getPublicIPFromService();
    }
    
    const payload = {
      ...botData,
      detectedPublicIP: detectedPublicIP
    };
    
    return await apiRequest('/bot-details', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    
  } catch (error) {
    throw error;
  }
};

/**
 * Get mining status for current session
 */
export const getMiningStatus = async () => {
  try {
    return await apiRequest('/mining/status');
  } catch (error) {
    throw error;
  }
};

/**
 * Get specific mining session status
 */
export const getSpecificMiningStatus = async (sessionId) => {
  try {
    return await apiRequest(`/mining/status/${sessionId}`);
  } catch (error) {
    throw error;
  }
};

/**
 * Stop mining session
 */
export const stopMiningSession = async (sessionId) => {
  try {
    return await apiRequest(`/mining/stop/${sessionId}`, {
      method: 'POST'
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Initialize API - call this when app starts
 */
export const initializeAPI = async () => {
  try {
    await getPublicIPFromService();
    
    return { success: true, publicIP: detectedPublicIP };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Export the detected IP for components that need it
export const getDetectedPublicIP = () => detectedPublicIP;