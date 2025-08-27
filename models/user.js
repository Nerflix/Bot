//Purpose: User data model and database operations
//Implementation:

//Export functions for CRUD operations on user data
//createUser(ipAddress, apiKey, secretKey) - Creates new user entry in Firebase
//getUserByIP(ipAddress) - Retrieves user data by IP address
//updateUserTimer(ipAddress, endTime) - Updates mining timer for user
//getUserCount() - Gets total number of users for auto-incrementing user IDs
//Each user stored as: /users/user_${count} with fields: ipAddress, apiKey, secretKey, timerEndTime, createdAt



//  /users/
//  /user_1/
//    - ipAddress: "192.168.1.1"
//    - apiKey: "user_api_key"
//    - secretKey: "user_secret_key"
//    - timerEndTime: timestamp
//    - createdAt: timestamp
//Connections: Used by routes/api.js for all database operations


// User Data Model and Database Operations
// User Data Model and Database Operations
const { getRef } = require('../config/database');

/**
 * Update user's last active timestamp
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
const updateUserLastActive = async (userId) => {
  try {
    const userRef = getRef(`users/${userId}`);
    await userRef.update({
      lastActive: Date.now()
    });
  } catch (error) {
    console.error('❌ Error updating last active:', error.message);
    // Don't throw error for this non-critical update
  }
};

/**
 * Get total number of users for auto-incrementing user IDs
 * @returns {Promise<number>} Total user count
 */
const getUserCount = async () => {
  try {
    console.log('📊 Getting user count...');
    
    const usersRef = getRef('users');
    const snapshot = await usersRef.once('value');
    
    if (!snapshot.exists()) {
      console.log('📊 No users found, count: 0');
      return 0;
    }
    
    const users = snapshot.val();
    const count = Object.keys(users).length;
    
    console.log(`📊 User count: ${count}`);
    return count;
    
  } catch (error) {
    console.error('❌ Error getting user count:', error.message);
    throw new Error(`Failed to get user count: ${error.message}`);
  }
};

/**
 * Create new user entry in Firebase
 * @param {string} ipAddress - User's IP address
 * @param {string} apiKey - User's API key (optional)
 * @param {string} secretKey - User's secret key
 * @returns {Promise<Object>} Created user data
 */
const createUser = async (ipAddress, apiKey = null, secretKey) => {
  try {
    console.log(`👤 Creating new user for IP: ${ipAddress}`);
    
    // Validate required fields
    if (!ipAddress) {
      throw new Error('IP address is required');
    }
    
    if (!secretKey) {
      throw new Error('Secret key is required');
    }
    
    // Get current user count for auto-incrementing ID
    const currentCount = await getUserCount();
    const newUserId = `user_${currentCount + 1}`;
    
    // Create user data object
    const userData = {
      ipAddress: ipAddress,
      apiKey: apiKey,
      secretKey: secretKey,
      timerEndTime: null,
      createdAt: Date.now(),
      lastActive: Date.now(),
      miningActive: false
    };
    
    // Save user to Firebase
    const userRef = getRef(`users/${newUserId}`);
    await userRef.set(userData);
    
    console.log(`✅ User created successfully: ${newUserId}`);
    
    // Return user data with ID
    return {
      id: newUserId,
      ...userData
    };
    
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    throw new Error(`Failed to create user: ${error.message}`);
  }
};

/**
 * Retrieve user data by IP address
 * @param {string} ipAddress - User's IP address
 * @returns {Promise<Object|null>} User data or null if not found
 */
const getUserByIP = async (ipAddress) => {
  try {
    console.log(`🔍 Looking up user by IP: ${ipAddress}`);
    
    if (!ipAddress) {
      throw new Error('IP address is required');
    }
    
    const usersRef = getRef('users');
    const snapshot = await usersRef.orderByChild('ipAddress').equalTo(ipAddress).once('value');
    
    if (!snapshot.exists()) {
      console.log(`👤 No user found for IP: ${ipAddress}`);
      return null;
    }
    
    // Get the first (and should be only) user with this IP
    const users = snapshot.val();
    const userId = Object.keys(users)[0];
    const userData = users[userId];
    
    console.log(`✅ User found: ${userId} for IP: ${ipAddress}`);
    
    // Update last active timestamp (non-blocking)
    updateUserLastActive(userId).catch(err => {
      console.error('Warning: Could not update last active:', err.message);
    });
    
    return {
      id: userId,
      ...userData
    };
    
  } catch (error) {
    console.error('❌ Error getting user by IP:', error.message);
    throw new Error(`Failed to get user: ${error.message}`);
  }
};

/**
 * Update mining timer for user
 * @param {string} ipAddress - User's IP address
 * @param {number} endTime - Mining end timestamp
 * @returns {Promise<Object>} Updated user data
 */
const updateUserTimer = async (ipAddress, endTime) => {
  try {
    console.log(`⏰ Updating timer for IP: ${ipAddress}`);
    
    if (!ipAddress) {
      throw new Error('IP address is required');
    }
    
    if (!endTime) {
      throw new Error('End time is required');
    }
    
    // Find user by IP
    const user = await getUserByIP(ipAddress);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Update timer data
    const updates = {
      timerEndTime: endTime,
      miningActive: true,
      lastActive: Date.now()
    };
    
    const userRef = getRef(`users/${user.id}`);
    await userRef.update(updates);
    
    console.log(`✅ Timer updated for user: ${user.id}`);
    
    return {
      ...user,
      ...updates
    };
    
  } catch (error) {
    console.error('❌ Error updating user timer:', error.message);
    throw new Error(`Failed to update timer: ${error.message}`);
  }
};

/**
 * Check if user's mining timer has expired
 * @param {string} ipAddress - User's IP address
 * @returns {Promise<Object>} Timer status and user data
 */
const checkUserTimer = async (ipAddress) => {
  try {
    console.log(`⏲️ Checking timer for IP: ${ipAddress}`);
    
    const user = await getUserByIP(ipAddress);
    
    if (!user) {
      return {
        userExists: false,
        timerActive: false,
        timerExpired: false,
        userData: null
      };
    }
    
    if (!user.timerEndTime || !user.miningActive) {
      return {
        userExists: true,
        timerActive: false,
        timerExpired: false,
        userData: user
      };
    }
    
    const currentTime = Date.now();
    const endTime = user.timerEndTime;
    const timerExpired = currentTime >= endTime;
    
    // If timer expired, update user status
    if (timerExpired && user.miningActive) {
      await updateUserMiningStatus(user.id, false);
      user.miningActive = false;
    }
    
    return {
      userExists: true,
      timerActive: !timerExpired && user.miningActive,
      timerExpired: timerExpired,
      timeRemaining: timerExpired ? 0 : endTime - currentTime,
      userData: user
    };
    
  } catch (error) {
    console.error('❌ Error checking user timer:', error.message);
    throw new Error(`Failed to check timer: ${error.message}`);
  }
};

/**
 * Update user's mining status
 * @param {string} userId - User ID
 * @param {boolean} isActive - Mining active status
 * @returns {Promise<void>}
 */
const updateUserMiningStatus = async (userId, isActive) => {
  try {
    const updates = {
      miningActive: isActive,
      lastActive: Date.now()
    };
    
    if (!isActive) {
      updates.timerEndTime = null;
    }
    
    const userRef = getRef(`users/${userId}`);
    await userRef.update(updates);
    
    console.log(`✅ Mining status updated for user ${userId}: ${isActive}`);
    
  } catch (error) {
    console.error('❌ Error updating mining status:', error.message);
    throw new Error(`Failed to update mining status: ${error.message}`);
  }
};

/**
 * Get all users (admin function)
 * @returns {Promise<Object>} All users data
 */
const getAllUsers = async () => {
  try {
    console.log('👥 Getting all users...');
    
    const usersRef = getRef('users');
    const snapshot = await usersRef.once('value');
    
    if (!snapshot.exists()) {
      return {};
    }
    
    const users = snapshot.val();
    console.log(`👥 Retrieved ${Object.keys(users).length} users`);
    
    return users;
    
  } catch (error) {
    console.error('❌ Error getting all users:', error.message);
    throw new Error(`Failed to get all users: ${error.message}`);
  }
};

/**
 * Delete user by IP address
 * @param {string} ipAddress - User's IP address
 * @returns {Promise<boolean>} Success status
 */
const deleteUserByIP = async (ipAddress) => {
  try {
    console.log(`🗑️ Deleting user by IP: ${ipAddress}`);
    
    const user = await getUserByIP(ipAddress);
    
    if (!user) {
      console.log(`👤 No user found to delete for IP: ${ipAddress}`);
      return false;
    }
    
    const userRef = getRef(`users/${user.id}`);
    await userRef.remove();
    
    console.log(`✅ User deleted: ${user.id}`);
    return true;
    
  } catch (error) {
    console.error('❌ Error deleting user:', error.message);
    throw new Error(`Failed to delete user: ${error.message}`);
  }
};

/**
 * Clean up expired timers (maintenance function)
 * @returns {Promise<number>} Number of users cleaned up
 */
const cleanupExpiredTimers = async () => {
  try {
    console.log('🧹 Cleaning up expired timers...');
    
    const users = await getAllUsers();
    let cleanedCount = 0;
    const currentTime = Date.now();
    
    for (const userId in users) {
      const user = users[userId];
      
      if (user.miningActive && user.timerEndTime && currentTime >= user.timerEndTime) {
        await updateUserMiningStatus(userId, false);
        cleanedCount++;
        console.log(`🧹 Cleaned expired timer for user: ${userId}`);
      }
    }
    
    console.log(`✅ Cleanup complete. ${cleanedCount} expired timers cleaned.`);
    return cleanedCount;
    
  } catch (error) {
    console.error('❌ Error cleaning up expired timers:', error.message);
    throw new Error(`Failed to cleanup expired timers: ${error.message}`);
  }
};

// Export all functions
module.exports = {
  // Core CRUD operations
  createUser,
  getUserByIP,
  updateUserTimer,
  getUserCount,
  
  // Additional utility functions
  checkUserTimer,
  updateUserMiningStatus,
  updateUserLastActive,
  getAllUsers,
  deleteUserByIP,
  cleanupExpiredTimers
};