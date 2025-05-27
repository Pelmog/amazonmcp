import fs from 'fs';
import path from 'path';

/**
 * Simple file-based logger for MCP server debugging
 * Writes log messages to a file instead of console to avoid interfering with MCP stdio protocol
 */

const LOG_FILE = path.join(process.cwd(), 'debug.log');

// Ensure log file exists
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, '');
}

/**
 * Log a debug message to file
 */
export function log(...args) {
  const timestamp = new Date().toISOString();
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');
  
  const logEntry = `[${timestamp}] ${message}\n`;
  
  try {
    fs.appendFileSync(LOG_FILE, logEntry);
  } catch (error) {
    // Silently fail to avoid breaking MCP server
  }
}

/**
 * Log an error message to file
 */
export function logError(...args) {
  const timestamp = new Date().toISOString();
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');
  
  const logEntry = `[${timestamp}] ERROR: ${message}\n`;
  
  try {
    fs.appendFileSync(LOG_FILE, logEntry);
  } catch (error) {
    // Silently fail to avoid breaking MCP server
  }
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

// Override console.log and console.error to redirect to file
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = (...args) => {
  log('[CONSOLE]', ...args);
};

console.error = (...args) => {
  logError('[CONSOLE]', ...args);
};

// Export the log file path for reference
export const LOG_FILE_PATH = LOG_FILE;