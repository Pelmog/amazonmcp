import { z } from 'zod';
import { getAccessToken } from '../utils/auth.js';
import { log as fileLog, logError } from '../utils/logger.js';

// Debug logging function
const log = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] [AUTH_TOOLS] ${message}`;
  if (level === 'ERROR') {
    logError(logMessage);
    if (data) {
      logError(`[${timestamp}] [${level}] [AUTH_TOOLS] Data:`, JSON.stringify(data, null, 2));
    }
  } else {
    fileLog(logMessage);
    if (data) {
      fileLog(`[${timestamp}] [${level}] [AUTH_TOOLS] Data:`, JSON.stringify(data, null, 2));
    }
  }
};

log('DEBUG', 'Auth tools module loaded');

export const authTools = {
      getAccessToken: {
        schema: {},
        handler: async () => {
          log('DEBUG', 'getAccessToken handler entry');
          
          try {
            log('DEBUG', 'Requesting access token from auth utils');
            const token = await getAccessToken();
            
            log('DEBUG', 'Access token retrieved successfully', {
              tokenPrefix: token ? token.substring(0, 10) + '...' : 'empty token'
            });
            
            return {
              content: [{ 
                type: "text", 
                text: `Access token retrieved successfully. Token: ${token.substring(0, 10)}...` 
              }]
            };
          } catch (error) {
            log('ERROR', 'getAccessToken handler error', {
              message: error.message,
              stack: error.stack,
              name: error.name
            });
            return {
              content: [{ type: "text", text: `Error retrieving access token: ${error.message}` }],
              isError: true
            };
          }
        },
        description: "Get an access token for Amazon SP-API"
      },
      
      checkCredentials: {
        schema: {},
        handler: async () => {
          log('DEBUG', 'checkCredentials handler entry');
          
          try {
            log('DEBUG', 'Testing credentials by requesting access token');
            await getAccessToken();
            
            log('DEBUG', 'Credentials check successful');
            return {
              content: [{ type: "text", text: "Credentials are valid and working correctly." }]
            };
          } catch (error) {
            log('ERROR', 'checkCredentials handler error', {
              message: error.message,
              stack: error.stack,
              name: error.name
            });
            return {
              content: [{ type: "text", text: `Credentials check failed: ${error.message}` }],
              isError: true
            };
          }
        },
        description: "Check if the SP-API credentials are valid"
      }
    };
