//Purpose: Session management middleware
//Implementation:

//Configure express-session with options:

//secret: process.env.SESSION_SECRET
//resave: false
//saveUninitialized: true
//cookie: { secure: false, maxAge: 48 * 60 * 60 * 1000 } (48 hours)


//Add user IP to session: req.session.userIP = req.ip
//Middleware function to ensure session persistence per IP address
//Handle session cleanup for expired timers

//Connections: Used by server.js and routes/api.js


// Session Management Middleware
// Enhanced Security Session Middleware
/**
 * Simple IP-based session management
 * No complex security features - just basic session handling
 */

/**
 * In-memory store for IP-based sessions
 */
/**
 * Simplified Session Management Middleware
 * Purpose: Provide IP-based identification without redundant state storage
 * Uses Firebase as single source of truth for all user data
 */

/**
 * Get clean client IP address
 */
/**
 * Session Middleware - IP-based session management
 * File: ./middleware/session.js
 */

const session = require('express-session');
const crypto = require('crypto');

console.log('🔐 Initializing session middleware...');

// In-memory session store (for development)
// In production, use Redis or database store
const sessionStore = new Map();

// Generate session ID based on IP and other factors
function generateSessionId(req) {
  const clientIP = req.headers['x-forwarded-for'] || 
                  req.headers['x-real-ip'] || 
                  req.connection.remoteAddress || 
                  req.socket.remoteAddress ||
                  (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                  '127.0.0.1';

  const userAgent = req.headers['user-agent'] || 'unknown';
  const timestamp = Date.now();
  
  // Create a unique session ID based on IP + User Agent + timestamp
  const sessionData = `${clientIP.split(',')[0].trim()}-${userAgent}-${timestamp}`;
  const sessionId = crypto
    .createHash('sha256')
    .update(sessionData)
    .digest('hex')
    .substring(0, 32);

  return sessionId;
}

// Custom session middleware
const ipSessionMiddleware = (req, res, next) => {
  try {
    // Generate or retrieve session ID
    let sessionId = req.headers['x-session-id'] || generateSessionId(req);
    
    // Get or create session data
    if (!sessionStore.has(sessionId)) {
      sessionStore.set(sessionId, {
        id: sessionId,
        createdAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        data: {}
      });
      console.log('🆕 New session created:', sessionId.substring(0, 16) + '...');
    } else {
      // Update last accessed time
      const sessionData = sessionStore.get(sessionId);
      sessionData.lastAccessed = new Date().toISOString();
      sessionStore.set(sessionId, sessionData);
      console.log('🔄 Existing session accessed:', sessionId.substring(0, 16) + '...');
    }

    // Attach session to request
    req.sessionId = sessionId;
    req.session = sessionStore.get(sessionId);

    // Helper function to save session data
    req.saveSession = (data) => {
      const sessionData = sessionStore.get(sessionId);
      sessionData.data = { ...sessionData.data, ...data };
      sessionData.lastAccessed = new Date().toISOString();
      sessionStore.set(sessionId, sessionData);
    };

    // Add session ID to response headers
    res.setHeader('X-Session-ID', sessionId);

    next();
  } catch (error) {
    console.error('💥 Session middleware error:', error);
    
    // Create fallback session
    const fallbackId = 'fallback-' + Date.now();
    req.sessionId = fallbackId;
    req.session = {
      id: fallbackId,
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      data: {}
    };
    
    next();
  }
};

// Clean up old sessions (run every hour)
const cleanupSessions = () => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  let cleanedCount = 0;
  for (const [sessionId, sessionData] of sessionStore.entries()) {
    const lastAccessed = new Date(sessionData.lastAccessed).getTime();
    if (now - lastAccessed > maxAge) {
      sessionStore.delete(sessionId);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} expired sessions`);
  }
  
  console.log(`📊 Active sessions: ${sessionStore.size}`);
};

// Start cleanup interval
setInterval(cleanupSessions, 60 * 60 * 1000); // Every hour

// Export session stats for monitoring
const getSessionStats = () => {
  return {
    activeSessions: sessionStore.size,
    sessions: Array.from(sessionStore.entries()).map(([id, data]) => ({
      id: id.substring(0, 16) + '...',
      createdAt: data.createdAt,
      lastAccessed: data.lastAccessed
    }))
  };
};

console.log('✅ Session middleware initialized');

module.exports = {
  ipSessionMiddleware,
  getSessionStats,
  cleanupSessions
};