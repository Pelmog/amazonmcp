import { z } from 'zod';
import { makeSpApiRequest } from '../utils/auth.js';
import { log as fileLog, logError } from '../utils/logger.js';

// Debug logging function
const log = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] [FEEDS] ${message}`;
  if (level === 'ERROR') {
    logError(logMessage);
    if (data) {
      logError(`[${timestamp}] [${level}] [FEEDS] Data:`, JSON.stringify(data, null, 2));
    }
  } else {
    fileLog(logMessage);
    if (data) {
      fileLog(`[${timestamp}] [${level}] [FEEDS] Data:`, JSON.stringify(data, null, 2));
    }
  }
};

log('DEBUG', 'Feeds tools module loaded');

export const feedsTools = {
      createFeed: {
        schema: {
          feedType: z.string().describe("The feed type"),
          marketplaceIds: z.array(z.string()).optional().describe("A list of marketplace IDs"),
          inputFeedDocumentId: z.string().describe("The document ID of the feed content")
        },
        handler: async ({ feedType, marketplaceIds, inputFeedDocumentId }) => {
          log('DEBUG', 'createFeed handler entry');
          log('DEBUG', 'Input parameters', { 
            feedType,
            marketplaceIds: marketplaceIds || 'using default',
            inputFeedDocumentId
          });
          
          try {
            const payload = {
              feedType,
              marketplaceIds: marketplaceIds || [process.env.SP_API_MARKETPLACE_ID],
              inputFeedDocumentId
            };
            
            log('DEBUG', 'Payload created', payload);
            
            log('DEBUG', 'Making SP-API request', {
              method: 'POST',
              endpoint: '/feeds/2021-06-30/feeds',
              payload
            });
            
            const data = await makeSpApiRequest(
              'POST',
              '/feeds/2021-06-30/feeds',
              payload
            );
            
            log('DEBUG', 'SP-API response received', {
              responseKeys: Object.keys(data || {}),
              feedId: data?.feedId || 'not found'
            });
            
            log('DEBUG', 'createFeed handler success');
            return {
              content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };
          } catch (error) {
            log('ERROR', 'createFeed handler error', {
              message: error.message,
              stack: error.stack,
              feedType,
              inputFeedDocumentId
            });
            return {
              content: [{ type: "text", text: `Error creating feed: ${error.message}` }],
              isError: true
            };
          }
        },
        description: "Create a feed"
      },
      
      getFeed: {
        schema: {
          feedId: z.string().describe("The feed ID")
        },
        handler: async ({ feedId }) => {
          log('DEBUG', 'getFeed handler entry');
          log('DEBUG', 'Input parameters', { feedId });
          
          try {
            log('DEBUG', 'Making SP-API request', {
              method: 'GET',
              endpoint: `/feeds/2021-06-30/feeds/${feedId}`
            });
            
            const data = await makeSpApiRequest(
              'GET',
              `/feeds/2021-06-30/feeds/${feedId}`
            );
            
            log('DEBUG', 'SP-API response received', {
              responseKeys: Object.keys(data || {}),
              feedId: data?.feedId || 'not found'
            });
            
            log('DEBUG', 'getFeed handler success');
            return {
              content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };
          } catch (error) {
            log('ERROR', 'getFeed handler error', {
              message: error.message,
              stack: error.stack,
              feedId
            });
            return {
              content: [{ type: "text", text: `Error retrieving feed: ${error.message}` }],
              isError: true
            };
          }
        },
        description: "Get information about a feed"
      },
      
      getFeedDocument: {
        schema: {
          feedDocumentId: z.string().describe("The feed document ID")
        },
        handler: async ({ feedDocumentId }) => {
          log('DEBUG', 'getFeedDocument handler entry');
          log('DEBUG', 'Input parameters', { feedDocumentId });
          
          try {
            log('DEBUG', 'Making SP-API request', {
              method: 'GET',
              endpoint: `/feeds/2021-06-30/documents/${feedDocumentId}`
            });
            
            const data = await makeSpApiRequest(
              'GET',
              `/feeds/2021-06-30/documents/${feedDocumentId}`
            );
            
            log('DEBUG', 'SP-API response received', {
              responseKeys: Object.keys(data || {}),
              documentId: data?.feedDocumentId || 'not found'
            });
            
            log('DEBUG', 'getFeedDocument handler success');
            return {
              content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };
          } catch (error) {
            log('ERROR', 'getFeedDocument handler error', {
              message: error.message,
              stack: error.stack,
              feedDocumentId
            });
            return {
              content: [{ type: "text", text: `Error retrieving feed document: ${error.message}` }],
              isError: true
            };
          }
        },
        description: "Get information about a feed document"
      }
    };
