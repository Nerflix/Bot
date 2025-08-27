/**
 * API Routes for Mining Timer Application
 * Purpose: Handle all API endpoints for user sessions, timer management, and mining operations
 */

/**
 * API Routes for Mining Timer Application
 * Purpose: Handle all API endpoints using Firebase as single source of truth
 * Removed redundant session management - all state comes from Firebase
 */

// Updated API Routes with Mining Timer Support
const express = require('express');
const router = express.Router();
const { getRef, isConnected } = require('../config/database');
const { generateRandomTimer, formatTimeRemaining, isTimerExpired } = require('../utils/timer');
const crypto = require('crypto');

console.log('Setting up API routes with mining timer support...');

// Improved IP detection function
const getClientIP = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  const remoteAddress = req.connection.remoteAddress || req.socket.remoteAddress;
  
  let clientIP = '127.0.0.1';
  
  if (forwardedFor) {
    clientIP = forwardedFor.split(',')[0].trim();
  } else if (realIP) {
    clientIP = realIP.trim();
  } else if (remoteAddress) {
    if (remoteAddress === '::1' || remoteAddress === '::ffff:127.0.0.1') {
      clientIP = '127.0.0.1';
    } else if (remoteAddress.startsWith('::ffff:')) {
      clientIP = remoteAddress.substring(7);
    } else {
      clientIP = remoteAddress;
    }
  }
  
  if ((clientIP === '127.0.0.1' || clientIP === '::1') && req.headers['x-client-public-ip']) {
    clientIP = req.headers['x-client-public-ip'];
    console.log('Using frontend-provided public IP:', clientIP);
  }
  
  console.log('Detected client IP:', clientIP);
  return clientIP;
};

// Generate session ID
const generateSessionId = (req) => {
  const clientIP = getClientIP(req);
  const userAgent = req.headers['user-agent'] || 'unknown';
  const timestamp = Date.now();
  
  const fingerprint = `${clientIP}-${userAgent}-${timestamp}`;
  const hash = crypto.createHash('sha256').update(fingerprint).digest('hex');
  
  return `session_${hash.substring(0, 16)}`;
};

// Store active sessions in memory
const activeSessions = new Map();

// Session management helper
const getOrCreateSession = (req) => {
  const clientIP = getClientIP(req);
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  // Try to find existing session by IP
  let existingSessionId = null;
  for (const [sessionId, sessionData] of activeSessions.entries()) {
    if (sessionData.clientIP === clientIP && sessionData.userAgent === userAgent) {
      existingSessionId = sessionId;
      break;
    }
  }
  
  if (existingSessionId) {
    const sessionData = activeSessions.get(existingSessionId);
    sessionData.lastAccessed = new Date().toISOString();
    activeSessions.set(existingSessionId, sessionData);
    return { sessionId: existingSessionId, ...sessionData };
  }
  
  // Create new session
  const newSessionId = generateSessionId(req);
  const sessionData = {
    sessionId: newSessionId,
    clientIP: clientIP,
    userAgent: userAgent,
    createdAt: new Date().toISOString(),
    lastAccessed: new Date().toISOString(),
    miningSessions: []
  };
  
  activeSessions.set(newSessionId, sessionData);
  console.log('Created new session:', newSessionId, 'for IP:', clientIP);
  return sessionData;
};

// Test connection endpoint
router.get('/test', async (req, res) => {
  console.log('Test endpoint hit');
  
  try {
    const testRef = getRef('test');
    await testRef.set({
      message: 'API connection test',
      timestamp: new Date().toISOString()
    });
    
    res.json({ 
      success: true, 
      message: 'API and Firebase connection successful',
      timestamp: new Date().toISOString(),
      firebaseConnected: isConnected(),
      detectedIP: getClientIP(req)
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.json({ 
      success: false, 
      message: 'API working but Firebase connection issue',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get public IP endpoint
router.get('/ip', (req, res) => {
  try {
    const clientIP = getClientIP(req);
    console.log('IP request from:', clientIP);
    
    res.json({ 
      success: true, 
      ip: clientIP,
      timestamp: new Date().toISOString(),
      detectionMethod: clientIP === '127.0.0.1' ? 'localhost' : 'remote'
    });
  } catch (error) {
    console.error('Error getting IP:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get IP address' 
    });
  }
});

// Session endpoints
router.get('/session/current', (req, res) => {
  try {
    const sessionData = getOrCreateSession(req);
    
    res.json({
      success: true,
      sessionId: sessionData.sessionId,
      clientIP: sessionData.clientIP,
      timestamp: new Date().toISOString(),
      data: sessionData
    });
  } catch (error) {
    console.error('Session current error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get session'
    });
  }
});

// Bot details submission with mining timer generation
router.post('/bot-details', async (req, res) => {
  try {
    const sessionData = getOrCreateSession(req);
    const clientIP = getClientIP(req);
    
    console.log('Bot details submission from session:', sessionData.sessionId);
    console.log('Client IP being stored:', clientIP);
    
    const { apiKey, secretKey } = req.body;
    if (!apiKey || !secretKey) {
      return res.status(400).json({
        success: false,
        error: 'API Key and Secret Key are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Generate random timer between 23-48 hours
    const timerDuration = generateRandomTimer();
    const startTime = Date.now();
    const endTime = startTime + timerDuration;

    // Create new mining session
    const miningSessionId = `mining_${Date.now()}`;
    const miningSession = {
      id: miningSessionId,
      apiKey: apiKey.trim(),
      secretKey: secretKey.trim(),
      startTime: startTime,
      endTime: endTime,
      duration: timerDuration,
      status: 'active',
      clientIP: clientIP,
      timestamp: new Date().toISOString()
    };

    // Store in Firebase
    const miningRef = getRef(`mining-sessions/${sessionData.sessionId}/${miningSessionId}`);
    await miningRef.set(miningSession);

    // Update session data
    const updatedSessionData = activeSessions.get(sessionData.sessionId);
    if (!updatedSessionData.miningSessions) {
      updatedSessionData.miningSessions = [];
    }
    updatedSessionData.miningSessions.push(miningSession);
    activeSessions.set(sessionData.sessionId, updatedSessionData);

    console.log('Mining session created:', miningSessionId);
    console.log('Timer duration:', timerDuration, 'ms (', timerDuration / (1000 * 60 * 60), 'hours)');

    res.json({
      success: true,
      message: 'Mining session started successfully',
      sessionId: sessionData.sessionId,
      miningSessionId: miningSessionId,
      clientIP: clientIP,
      data: {
        startTime: startTime,
        endTime: endTime,
        timeRemaining: timerDuration,
        status: 'active',
        formattedTimeRemaining: formatTimeRemaining(endTime)
      }
    });

  } catch (error) {
    console.error('Error processing bot details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process bot details',
      message: error.message,
      code: 'PROCESSING_ERROR'
    });
  }
});

// Get mining status for current session
router.get('/mining/status', async (req, res) => {
  try {
    const sessionData = getOrCreateSession(req);
    
    // Get mining sessions from Firebase
    const miningRef = getRef(`mining-sessions/${sessionData.sessionId}`);
    const snapshot = await miningRef.once('value');
    const miningSessions = snapshot.val() || {};
    
    const activeMiningessions = [];
    const now = Date.now();
    
    // Check each mining session
    for (const [sessionId, session] of Object.entries(miningSessions)) {
      const expired = isTimerExpired(session.endTime);
      
      if (!expired) {
        activeMiningessions.push({
          id: session.id,
          startTime: session.startTime,
          endTime: session.endTime,
          timeRemaining: session.endTime - now,
          formattedTimeRemaining: formatTimeRemaining(session.endTime),
          status: session.status,
          apiKey: session.apiKey.substring(0, 8) + '...',
          secretKey: session.secretKey.substring(0, 8) + '...'
        });
      } else {
        // Update expired session
        await miningRef.child(sessionId).update({
          status: 'completed',
          completedAt: now
        });
      }
    }

    res.json({
      success: true,
      sessionId: sessionData.sessionId,
      activeSessions: activeMiningessions.length,
      sessions: activeMiningessions,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching mining status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch mining status',
      message: error.message
    });
  }
});

// Get specific mining session status
router.get('/mining/status/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const currentSession = getOrCreateSession(req);
    
    const miningRef = getRef(`mining-sessions/${currentSession.sessionId}/${sessionId}`);
    const snapshot = await miningRef.once('value');
    const miningSession = snapshot.val();
    
    if (!miningSession) {
      return res.status(404).json({
        success: false,
        error: 'Mining session not found',
        code: 'NOT_FOUND'
      });
    }

    const now = Date.now();
    const expired = isTimerExpired(miningSession.endTime);
    
    if (expired && miningSession.status === 'active') {
      // Update to completed
      await miningRef.update({
        status: 'completed',
        completedAt: now
      });
      miningSession.status = 'completed';
    }

    res.json({
      success: true,
      session: {
        id: miningSession.id,
        startTime: miningSession.startTime,
        endTime: miningSession.endTime,
        timeRemaining: Math.max(0, miningSession.endTime - now),
        formattedTimeRemaining: formatTimeRemaining(miningSession.endTime),
        status: miningSession.status,
        expired: expired
      }
    });

  } catch (error) {
    console.error('Error fetching specific mining status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch mining session status',
      message: error.message
    });
  }
});

// Stop mining session
router.post('/mining/stop/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const currentSession = getOrCreateSession(req);
    
    const miningRef = getRef(`mining-sessions/${currentSession.sessionId}/${sessionId}`);
    const snapshot = await miningRef.once('value');
    const miningSession = snapshot.val();
    
    if (!miningSession) {
      return res.status(404).json({
        success: false,
        error: 'Mining session not found',
        code: 'NOT_FOUND'
      });
    }

    // Update session to stopped
    await miningRef.update({
      status: 'stopped',
      stoppedAt: Date.now()
    });

    res.json({
      success: true,
      message: 'Mining session stopped successfully',
      sessionId: sessionId
    });

  } catch (error) {
    console.error('Error stopping mining session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop mining session',
      message: error.message
    });
  }
});

// Admin endpoint to see all sessions and their mining status
router.get('/admin/sessions', async (req, res) => {
  try {
    const sessions = Array.from(activeSessions.entries()).map(([id, data]) => ({
      sessionId: id,
      clientIP: data.clientIP,
      userAgent: data.userAgent.substring(0, 50) + '...',
      createdAt: data.createdAt,
      lastAccessed: data.lastAccessed,
      miningSessionsCount: data.miningSessions ? data.miningSessions.length : 0
    }));

    // Get all mining sessions from Firebase
    const allMiningSessions = {};
    const miningRef = getRef('mining-sessions');
    const snapshot = await miningRef.once('value');
    const firebaseSessions = snapshot.val() || {};
    
    let totalActive = 0;
    let totalCompleted = 0;
    
    for (const [sessionId, sessions] of Object.entries(firebaseSessions)) {
      for (const [miningId, miningData] of Object.entries(sessions)) {
        if (miningData.status === 'active' && !isTimerExpired(miningData.endTime)) {
          totalActive++;
        } else {
          totalCompleted++;
        }
      }
    }

    res.json({
      success: true,
      count: sessions.length,
      sessions: sessions,
      miningStats: {
        totalActive: totalActive,
        totalCompleted: totalCompleted,
        total: totalActive + totalCompleted
      }
    });
  } catch (error) {
    console.error('Error fetching admin sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sessions'
    });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    firebaseConnected: isConnected(),
    activeSessions: activeSessions.size
  });
});

// Cleanup old sessions every hour
setInterval(() => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  let cleaned = 0;
  for (const [sessionId, sessionData] of activeSessions.entries()) {
    const lastAccessed = new Date(sessionData.lastAccessed).getTime();
    if (now - lastAccessed > maxAge) {
      activeSessions.delete(sessionId);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} expired sessions`);
  }
}, 60 * 60 * 1000);

module.exports = router;