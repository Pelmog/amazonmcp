import fs from 'fs';
import path from 'path';

/**
 * Simple file-based logger for MCP server debugging
 * Writes log messages to a file instead of console to avoid interfering with MCP stdio protocol
 */

const LOG_FILE = path.join(process.cwd(), 'debug.log');

// Log levels
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// Current log level (can be set via environment variable or command line)
let currentLogLevel = LOG_LEVELS.DEBUG;

// Set log level from environment or command line
const _setLogLevel = (level) => {
  if (typeof level === 'string') {
    const upperLevel = level.toUpperCase();
    if (LOG_LEVELS.hasOwnProperty(upperLevel)) {
      currentLogLevel = LOG_LEVELS[upperLevel];
      return true;
    }
  } else if (typeof level === 'number' && level >= 0 && level <= 3) {
    currentLogLevel = level;
    return true;
  }
  return false;
};

// Initialize log level from environment variable
if (process.env.LOG_LEVEL) {
  _setLogLevel(process.env.LOG_LEVEL);
}

// Ensure log file exists
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, '');
}

/**
 * Internal logging function with level checking
 */
function writeLog(level, levelName, ...args) {
  if (level < currentLogLevel) {
    return; // Skip logging if below current level
  }
  
  const timestamp = new Date().toISOString();
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');
  
  const logEntry = `[${timestamp}] ${levelName}: ${message}\n`;
  
  try {
    fs.appendFileSync(LOG_FILE, logEntry);
  } catch (error) {
    // Silently fail to avoid breaking MCP server
  }
}

/**
 * Log a debug message to file
 */
export function log(...args) {
  writeLog(LOG_LEVELS.DEBUG, 'DEBUG', ...args);
}

/**
 * Log an info message to file
 */
export function logInfo(...args) {
  writeLog(LOG_LEVELS.INFO, 'INFO', ...args);
}

/**
 * Log a warning message to file
 */
export function logWarn(...args) {
  writeLog(LOG_LEVELS.WARN, 'WARN', ...args);
}

/**
 * Log an error message to file
 */
export function logError(...args) {
  writeLog(LOG_LEVELS.ERROR, 'ERROR', ...args);
}

/**
 * Clear the log file
 */
export function clearLog() {
  try {
    fs.writeFileSync(LOG_FILE, '');
  } catch (error) {
    // Silently fail to avoid breaking MCP server
  }
}

/**
 * Set the current log level
 */
export function setLogLevel(level) {
  const success = _setLogLevel(level);
  if (success) {
    writeLog(LOG_LEVELS.INFO, 'INFO', `Log level set to: ${Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === currentLogLevel)}`);
  }
  return success;
}

/**
 * Get the current log level
 */
export function getLogLevel() {
  return Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === currentLogLevel);
}

// Override console.log and console.error to redirect to file
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = (...args) => {
  writeLog(LOG_LEVELS.DEBUG, 'CONSOLE', ...args);
};

console.error = (...args) => {
  writeLog(LOG_LEVELS.ERROR, 'CONSOLE', ...args);
};

// Export the log file path and levels for reference
export const LOG_FILE_PATH = LOG_FILE;
export const LEVELS = LOG_LEVELS;
export { setLogLevel as setLevel };