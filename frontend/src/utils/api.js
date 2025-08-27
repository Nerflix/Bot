// Production API Utils - frontend/src/utils/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Store the detected public IP globally
let detectedPublicIP = null;

/**
 * Create fetch with timeout
 */
const fetchWithTimeout = async (url, options = {}, timeout = 5000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Get public IP from external service
 */
const getPublicIPFromService = async () => {
  const services = [
    {
      url: 'https://api.ipify.org?format=json',
      parseIP: (data) => data.ip
    },
    {
      url: 'https://ipapi.co/json/',
      parseIP: (data) => data.ip
    },
    {
      url: 'https://httpbin.org/ip',
      parseIP: (data) => data.origin
    }
  ];
  
  for (const service of services) {
    try {
      const response = await fetchWithTimeout(service.url, {}, 5000);
      
      if (!response.ok) continue;
      
      const data = await response.json();
      const ip = service.parseIP(data);
      
      if (ip && ip !== '127.0.0.1' && ip !== '::1') {
        detectedPublicIP = ip;
        return ip;
      }
      
    } catch (serviceError) {
      continue;
    }
  }
  
  detectedPublicIP = '127.0.0.1';
  return '127.0.0.1';
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
    
    const response = await fetchWithTimeout(url, requestOptions, 10000);
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      throw new Error(errorData.message || `Request failed`);
    }
    
    const data = await response.json();
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
    const result = await apiRequest('/test');
    return result;
  } catch (error) {
    return {
      success: false,
      message: error.message,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Get public IP
 */
export const getPublicIP = async () => {
  try {
    // Try API first
    try {
      const result = await apiRequest('/ip');
      if (result.success && result.ip && result.ip !== '127.0.0.1' && result.ip !== '::1') {
        detectedPublicIP = result.ip;
        return result.ip;
      }
    } catch (apiError) {
      // Fallback to external services
    }
    
    const publicIP = await getPublicIPFromService();
    return publicIP;
    
  } catch (error) {
    detectedPublicIP = '127.0.0.1';
    return '127.0.0.1';
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