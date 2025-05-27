import { z } from 'zod';
import { makeSpApiRequest } from '../utils/auth.js';
import { log as fileLog, logError } from '../utils/logger.js';

// Debug logging function
const log = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] [SELLER] ${message}`;
  if (level === 'ERROR') {
    logError(logMessage);
    if (data) {
      logError(`[${timestamp}] [${level}] [SELLER] Data:`, JSON.stringify(data, null, 2));
    }
  } else {
    fileLog(logMessage);
    if (data) {
      fileLog(`[${timestamp}] [${level}] [SELLER] Data:`, JSON.stringify(data, null, 2));
    }
  }
};

log('DEBUG', 'Seller tools module loaded');

export const sellerTools = {
      getMarketplaceParticipations: {
        schema: {},
        handler: async () => {
          log('DEBUG', 'getMarketplaceParticipations handler entry');
          
          try {
            log('DEBUG', 'Making SP-API request', {
              method: 'GET',
              endpoint: '/sellers/v1/marketplaceParticipations'
            });
            
            const data = await makeSpApiRequest(
              'GET',
              '/sellers/v1/marketplaceParticipations'
            );
            
            log('DEBUG', 'SP-API response received', {
              responseKeys: Object.keys(data || {}),
              participationsCount: data?.payload?.length || 0
            });
            
            log('DEBUG', 'getMarketplaceParticipations handler success');
            return {
              content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };
          } catch (error) {
            log('ERROR', 'getMarketplaceParticipations handler error', {
              message: error.message,
              stack: error.stack,
              name: error.name
            });
            return {
              content: [{ type: "text", text: `Error getting marketplace participations: ${error.message}` }],
              isError: true
            };
          }
        },
        description: "Returns a list of marketplaces that the seller participates in"
      }
    };
