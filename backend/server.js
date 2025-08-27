//Purpose: Main server file that starts Express server and connects all middleware
//Implementation:


/**
 * Main server file that starts Express server and connects all middleware
 * Purpose: Initialize Express app with Firebase - NO session management
 * All data stored in Firebase Realtime Database
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🚀 Starting server setup (Firebase only)...');

// Basic Express setup
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());
console.log('✅ Basic Express setup complete');

// Early health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    storage: 'Firebase Realtime Database'
  });
});
console.log('✅ Health endpoint configured');

// Initialize Firebase Database
console.log('🔥 Initializing Firebase Database...');
try {
  const { initializeFirebase, isConnected } = require('./config/database');
  
  if (!isConnected()) {
    console.log('⚠️ Firebase not auto-initialized, attempting manual initialization...');
    initializeFirebase();
  }
  
  console.log('✅ Firebase database module loaded successfully');
} catch (error) {
  console.error('❌ Firebase database initialization failed:', error.message);
  console.error('💡 Check your Firebase configuration and credentials');
  // Don't exit - let the app start without Firebase for debugging
}

// Import and use API routes (no session middleware needed)
console.log('📡 Setting up API routes...');
try {
  const apiRoutes = require('./routes/api');
  app.use('/api', apiRoutes);
  console.log('✅ API routes imported and configured successfully');
} catch (error) {
  console.error('❌ API routes import failed:', error.message);
  // Create minimal fallback API
  app.get('/api/test', (req, res) => {
    res.json({ 
      success: false, 
      message: 'Fallback API - routes failed to load',
      error: error.message 
    });
  });
  console.log('⚠️ Using fallback API routes');
}

// Serve static files from frontend
console.log('📁 Setting up static file serving...');
const staticPath = path.join(__dirname, '../frontend/dist');
console.log('Static files path:', staticPath);

try {
  app.use(express.static(staticPath));
  console.log('✅ Static file serving configured');
} catch (error) {
  console.error('❌ Static file serving setup failed:', error);
}

// React app serving for SPA routes
console.log('⚛️ Setting up React SPA routing...');
app.use((req, res, next) => {
  // Skip API routes and actual files
  if (req.path.startsWith('/api') || req.path.includes('.')) {
    return next();
  }
  
  const indexPath = path.join(__dirname, '../frontend/dist/index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('❌ Error serving index.html:', err);
      res.status(500).json({ 
        success: false,
        error: 'Could not serve frontend application' 
      });
    }
  });
});

// Global error handler
console.log('🛡️ Setting up error handler...');
app.use((err, req, res, next) => {
  console.error('💥 Unhandled application error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString()
  });
});

// Start the server
console.log('🎯 Starting HTTP server...');
try {
  const server = app.listen(PORT, () => {
    console.log('\n🎉 ===== SERVER STARTED SUCCESSFULLY =====');
    console.log(`🌐 Server: http://localhost:${PORT}`);
    console.log(`💊 Health: http://localhost:${PORT}/health`);
    console.log(`🔌 API: http://localhost:${PORT}/api/test`);
    console.log(`🗄️ Storage: Firebase Realtime Database`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('============================================\n');

    // Test Firebase connection after server starts
    setTimeout(async () => {
      try {
        const { getRef, isConnected } = require('./config/database');
        if (isConnected()) {
          console.log('🔥 Testing Firebase connection...');
          const testRef = getRef('server-status');
          await testRef.set({
            status: 'online',
            timestamp: new Date().toISOString(),
            port: PORT
          });
          console.log('✅ Firebase connection test successful');
        }
      } catch (error) {
        console.error('❌ Firebase connection test failed:', error.message);
      }
    }, 2000);
  });

  server.on('error', (error) => {
    console.error('💥 Server error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`💡 Port ${PORT} is already in use. Try a different port.`);
    }
  });

} catch (error) {
  console.error('💥 Failed to start server:', error);
  process.exit(1);
}

// Graceful shutdown handlers
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
  
  try {
    // Clean up Firebase connection
    const { closeConnection } = require('./config/database');
    await closeConnection();
    console.log('✅ Firebase connection closed');
  } catch (error) {
    console.error('❌ Error during shutdown:', error.message);
  }
  
  console.log('👋 Server shutdown complete');
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Promise Rejection at:', promise);
  console.error('Reason:', reason);
  process.exit(1);
});

console.log('✅ Server initialization complete - waiting for requests...');

module.exports = app;