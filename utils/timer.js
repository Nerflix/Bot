//Purpose: Timer utility functions
//Implementation:

//generateRandomTimer() - Returns random milliseconds between 23-48 hours

//Math.random() * (48 - 23) + 23 hours converted to milliseconds


//formatTimeRemaining(endTime) - Formats remaining time as {hours, minutes, seconds}
//isTimerExpired(endTime) - Checks if timer has expired
//Helper functions for time calculations

//Connections: Used by routes/api.js for timer operations

/**
 * Timer utility functions for mining bot project
 * Purpose: Generate random mining timers and manage time calculations
 */

/**
 * Generates a random timer between 23-48 hours
 * @returns {number} Random milliseconds between 23-48 hours
 */
/**
 * Timer utility functions for mining bot project
 * Purpose: Generate random mining timers and manage time calculations
 */

/**
 * Generates a random timer between 23-48 hours
 * @returns {number} Random milliseconds between 23-48 hours
 */
const generateRandomTimer = () => {
  const minHours = 23;
  const maxHours = 48;
  
  // Generate random number between minHours and maxHours
  const randomHours = Math.random() * (maxHours - minHours) + minHours;
  
  // Convert to milliseconds
  const milliseconds = Math.floor(randomHours * 60 * 60 * 1000);
  
  console.log(`⏱️ Generated random timer: ${randomHours.toFixed(2)} hours (${milliseconds}ms)`);
  
  return milliseconds;
};

/**
 * Formats remaining time as object with hours, minutes, seconds
 * @param {number} endTime - End timestamp in milliseconds
 * @returns {Object} Object with hours, minutes, seconds, and total milliseconds
 */
const formatTimeRemaining = (endTime) => {
  const currentTime = getCurrentTimestamp();
  const timeLeft = endTime - currentTime;
  
  if (timeLeft <= 0) {
    return {
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMilliseconds: 0,
      expired: true,
      display: "00:00:00"
    };
  }
  
  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
  
  // Format display string
  const display = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  return {
    hours,
    minutes,
    seconds,
    totalMilliseconds: timeLeft,
    expired: false,
    display
  };
};

/**
 * Checks if timer has expired
 * @param {number} endTime - End timestamp in milliseconds
 * @returns {boolean} True if timer has expired
 */
const isTimerExpired = (endTime) => {
  if (!endTime) return true;
  return getCurrentTimestamp() >= endTime;
};

/**
 * Gets current timestamp in milliseconds
 * @returns {number} Current timestamp
 */
const getCurrentTimestamp = () => {
  return Date.now();
};

/**
 * Gets future timestamp by adding duration to current time
 * @param {number} durationMs - Duration in milliseconds to add
 * @returns {number} Future timestamp
 */
const getFutureTimestamp = (durationMs) => {
  return getCurrentTimestamp() + durationMs;
};

/**
 * Formats timestamp into readable string
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {string} Formatted date string
 */
const formatTimeString = (timestamp) => {
  if (!timestamp) return 'Not set';
  
  const date = new Date(timestamp);
  
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

/**
 * Calculates timer progress percentage
 * @param {number} startTime - Start timestamp
 * @param {number} endTime - End timestamp
 * @returns {number} Progress percentage (0-100)
 */
const getTimerProgress = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  
  const currentTime = getCurrentTimestamp();
  const totalDuration = endTime - startTime;
  const elapsed = currentTime - startTime;
  
  if (elapsed <= 0) return 0;
  if (elapsed >= totalDuration) return 100;
  
  return Math.round((elapsed / totalDuration) * 100);
};

/**
 * Calculates time until specific timestamp
 * @param {number} targetTime - Target timestamp
 * @returns {Object} Time until target with breakdown
 */
const getTimeUntil = (targetTime) => {
  const now = getCurrentTimestamp();
  const timeDiff = targetTime - now;
  
  if (timeDiff <= 0) {
    return {
      passed: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      display: 'Time has passed'
    };
  }
  
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
  
  let display = '';
  if (days > 0) display += `${days}d `;
  display += `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  return {
    passed: false,
    days,
    hours,
    minutes,
    seconds,
    totalMilliseconds: timeDiff,
    display
  };
};

/**
 * Validates timer duration
 * @param {number} durationMs - Duration in milliseconds
 * @returns {boolean} True if duration is within valid range
 */
const isValidTimerDuration = (durationMs) => {
  const minMs = 23 * 60 * 60 * 1000; // 23 hours
  const maxMs = 48 * 60 * 60 * 1000; // 48 hours
  
  return durationMs >= minMs && durationMs <= maxMs;
};

/**
 * Converts hours to milliseconds
 * @param {number} hours - Number of hours
 * @returns {number} Milliseconds
 */
const hoursToMs = (hours) => {
  return hours * 60 * 60 * 1000;
};

/**
 * Converts milliseconds to hours
 * @param {number} milliseconds - Number of milliseconds
 * @returns {number} Hours (with decimal places)
 */
const msToHours = (milliseconds) => {
  return milliseconds / (60 * 60 * 1000);
};

/**
 * Creates a human-readable duration string
 * @param {number} milliseconds - Duration in milliseconds
 * @returns {string} Human readable duration
 */
const formatDuration = (milliseconds) => {
  if (milliseconds <= 0) return '0 seconds';
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ${hours % 24} hour${hours % 24 !== 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes % 60} minute${minutes % 60 !== 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ${seconds % 60} second${seconds % 60 !== 1 ? 's' : ''}`;
  } else {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
};

/**
 * Gets timer status object
 * @param {number} endTime - End timestamp
 * @returns {Object} Complete timer status
 */
const getTimerStatus = (endTime) => {
  const expired = isTimerExpired(endTime);
  const timeRemaining = formatTimeRemaining(endTime);
  
  return {
    expired,
    active: !expired,
    endTime,
    timeRemaining,
    readable: formatTimeString(endTime),
    display: timeRemaining.display
  };
};

// Export all timer utility functions
module.exports = {
  // Core timer functions
  generateRandomTimer,
  formatTimeRemaining,
  isTimerExpired,
  getCurrentTimestamp,
  getFutureTimestamp,
  
  // Formatting functions
  formatTimeString,
  formatDuration,
  getTimeUntil,
  
  // Progress and status functions
  getTimerProgress,
  getTimerStatus,
  
  // Validation functions
  isValidTimerDuration,
  
  // Conversion utilities
  hoursToMs,
  msToHours
};