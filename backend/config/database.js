//Purpose: Firebase Realtime Database configuration and connection
//Implementation:

//Import firebase-admin SDK
//Load service account key from environment variables or JSON file
//Initialize Firebase Admin SDK with credentials and database URL
//Export database reference for use in other files
//Include error handling for connection failures

//Environment Variables Needed:

//FIREBASE_DATABASE_URL
//FIREBASE_SERVICE_ACCOUNT (path to service account JSON)

//Connections: Used by server.js and routes/api.js for database operations


// Firebase Realtime Database Configuration and Connection
const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

let database = null;
let isInitialized = false;

/**
 * Initialize Firebase Admin SDK with credentials
 */
const initializeFirebase = () => {
  try {
    console.log('🔥 Initializing Firebase Admin SDK...');

    // Check if already initialized
    if (isInitialized) {
      console.log('✅ Firebase already initialized');
      return database;
    }

    // Load service account credentials
    let serviceAccount;
    
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // Load from JSON file path
      const serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT);
      console.log(`📁 Loading service account from: ${serviceAccountPath}`);
      serviceAccount = require(serviceAccountPath);
    } else if (process.env.FIREBASE_PRIVATE_KEY) {
      // Load from environment variables (for deployment)
      console.log('🔐 Loading service account from environment variables');
      serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/oauth2/v1/certs?gserviceaccount=${process.env.FIREBASE_CLIENT_EMAIL}`
      };
    } else {
      throw new Error('Firebase service account credentials not found. Set FIREBASE_SERVICE_ACCOUNT or individual environment variables.');
    }

    // Validate required environment variables
    if (!process.env.FIREBASE_DATABASE_URL) {
      throw new Error('FIREBASE_DATABASE_URL environment variable is required');
    }

    // Initialize Firebase Admin SDK
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
      projectId: serviceAccount.project_id
    });

    // Get database reference
    database = admin.database();
    isInitialized = true;

    console.log('✅ Firebase Admin SDK initialized successfully');
    console.log(`🔗 Connected to database: ${process.env.FIREBASE_DATABASE_URL}`);

    // Test database connection
    return testConnection();

  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    
    // Provide helpful error messages
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('💡 Make sure the service account JSON file path is correct');
    } else if (error.message.includes('credential')) {
      console.error('💡 Check your service account credentials and permissions');
    } else if (error.message.includes('databaseURL')) {
      console.error('💡 Verify your Firebase Database URL is correct');
    }
    
    throw error;
  }
};

/**
 * Test database connection
 */
const testConnection = async () => {
  try {
    console.log('🧪 Testing database connection...');
    
    // Try to read from root (should fail with permission denied, but confirms connection)
    const testRef = database.ref('.info/connected');
    
    return new Promise((resolve, reject) => {
      testRef.once('value', (snapshot) => {
        if (snapshot.val() === true) {
          console.log('✅ Database connection test successful');
          resolve(database);
        } else {
          console.log('⚠️ Database connection test inconclusive');
          resolve(database);
        }
      }, (error) => {
        // Even permission denied means we're connected
        if (error.code === 'PERMISSION_DENIED') {
          console.log('✅ Database connection confirmed (permission rules active)');
          resolve(database);
        } else {
          console.error('❌ Database connection test failed:', error.message);
          reject(error);
        }
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        console.log('⏰ Database connection test timeout - assuming success');
        resolve(database);
      }, 5000);
    });

  } catch (error) {
    console.error('❌ Database connection test error:', error.message);
    return database; // Return database anyway, let actual operations handle errors
  }
};

/**
 * Get database reference
 */
const getDatabase = () => {
  if (!isInitialized || !database) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return database;
};

/**
 * Get a specific database reference path
 */
const getRef = (path) => {
  const db = getDatabase();
  return db.ref(path);
};

/**
 * Check if Firebase is initialized
 */
const isConnected = () => {
  return isInitialized && database !== null;
};

/**
 * Gracefully close database connection
 */
const closeConnection = async () => {
  try {
    if (isInitialized && database) {
      console.log('🔥 Closing Firebase connection...');
      await admin.app().delete();
      database = null;
      isInitialized = false;
      console.log('✅ Firebase connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing Firebase connection:', error.message);
  }
};

/**
 * Handle process termination
 */
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, closing Firebase connection...');
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, closing Firebase connection...');
  await closeConnection();
  process.exit(0);
});

// Auto-initialize on module load
try {
  initializeFirebase();
} catch (error) {
  console.error('❌ Failed to auto-initialize Firebase:', error.message);
  console.log('💡 Firebase will need to be manually initialized');
}

// Export functions and references
module.exports = {
  database, // actual instance, not a function
  getRef,
  isConnected,
  initializeFirebase,
  closeConnection,
  admin,
  ref: (path) => getRef(path),
};
