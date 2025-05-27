import { z } from 'zod';
import { makeSpApiRequest } from '../utils/auth.js';
import { log as fileLog, logError } from '../utils/logger.js';

// Debug logging function
const log = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] [NOTIFICATIONS] ${message}`;
  if (level === 'ERROR') {
    logError(logMessage);
    if (data) {
      logError(`[${timestamp}] [${level}] [NOTIFICATIONS] Data:`, JSON.stringify(data, null, 2));
    }
  } else {
    fileLog(logMessage);
    if (data) {
      fileLog(`[${timestamp}] [${level}] [NOTIFICATIONS] Data:`, JSON.stringify(data, null, 2));
    }
  }
};

log('DEBUG', 'Notifications tools module loaded');

export const notificationsTools = {
      getSubscription: {
        schema: {
          notificationType: z.string().describe("The notification type"),
          marketplaceId: z.string().optional().describe("The marketplace ID. Defaults to the one in environment variables")
        },
        handler: async ({ notificationType, marketplaceId }) => {
          log('DEBUG', 'getSubscription handler entry');
          log('DEBUG', 'Input parameters', { 
            notificationType,
            marketplaceId: marketplaceId || 'using default'
          });
          
          try {
            const marketplace = marketplaceId || process.env.SP_API_MARKETPLACE_ID;
            
            log('DEBUG', 'Making SP-API request', {
              method: 'GET',
              endpoint: `/notifications/v1/subscriptions/${notificationType}`,
              queryParams: { marketplaceIds: marketplace }
            });
            
            const data = await makeSpApiRequest(
              'GET',
              `/notifications/v1/subscriptions/${notificationType}`,
              null,
              { marketplaceIds: marketplace }
            );
            
            log('DEBUG', 'SP-API response received', {
              responseKeys: Object.keys(data || {})
            });
            
            log('DEBUG', 'getSubscription handler success');
            return {
              content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };
          } catch (error) {
            log('ERROR', 'getSubscription handler error', {
              message: error.message,
              stack: error.stack,
              notificationType
            });
            return {
              content: [{ type: "text", text: `Error getting subscription: ${error.message}` }],
              isError: true
            };
          }
        },
        description: "Returns information about a subscription for the specified notification type"
      },
      
      createSubscription: {
        schema: {
          notificationType: z.string().describe("The notification type"),
          payloadVersion: z.string().describe("The version of the payload object to be used in the notification"),
          destinationId: z.string().describe("The identifier for the destination where notifications will be delivered"),
          marketplaceId: z.string().optional().describe("The marketplace ID. Defaults to the one in environment variables")
        },
        handler: async ({ notificationType, payloadVersion, destinationId, marketplaceId }) => {
          log('DEBUG', 'createSubscription handler entry');
          log('DEBUG', 'Input parameters', { 
            notificationType,
            payloadVersion,
            destinationId,
            marketplaceId: marketplaceId || 'using default'
          });
          
          try {
            const marketplace = marketplaceId || process.env.SP_API_MARKETPLACE_ID;
            const payload = {
              payloadVersion,
              destinationId
            };
            
            log('DEBUG', 'Payload created', payload);
            
            log('DEBUG', 'Making SP-API request', {
              method: 'POST',
              endpoint: `/notifications/v1/subscriptions/${notificationType}`,
              payload,
              queryParams: { marketplaceIds: marketplace }
            });
            
            const data = await makeSpApiRequest(
              'POST',
              `/notifications/v1/subscriptions/${notificationType}`,
              payload,
              { marketplaceIds: marketplace }
            );
            
            log('DEBUG', 'SP-API response received', {
              responseKeys: Object.keys(data || {})
            });
            
            log('DEBUG', 'createSubscription handler success');
            return {
              content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };
          } catch (error) {
            log('ERROR', 'createSubscription handler error', {
              message: error.message,
              stack: error.stack,
              notificationType,
              destinationId
            });
            return {
              content: [{ type: "text", text: `Error creating subscription: ${error.message}` }],
              isError: true
            };
          }
        },
        description: "Creates a subscription for the specified notification type"
      },
      
      getDestinations: {
        schema: {},
        handler: async () => {
          log('DEBUG', 'getDestinations handler entry');
          
          try {
            log('DEBUG', 'Making SP-API request', {
              method: 'GET',
              endpoint: '/notifications/v1/destinations'
            });
            
            const data = await makeSpApiRequest(
              'GET',
              '/notifications/v1/destinations'
            );
            
            log('DEBUG', 'SP-API response received', {
              responseKeys: Object.keys(data || {}),
              destinationsCount: data?.destinations?.length || 0
            });
            
            log('DEBUG', 'getDestinations handler success');
            return {
              content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };
          } catch (error) {
            log('ERROR', 'getDestinations handler error', {
              message: error.message,
              stack: error.stack
            });
            return {
              content: [{ type: "text", text: `Error getting destinations: ${error.message}` }],
              isError: true
            };
          }
        },
        description: "Returns information about all destinations"
      },
      
      createDestination: {
        schema: {
          name: z.string().describe("The name of the destination"),
          resourceSpecification: z.object({
            sqs: z.object({
              arn: z.string().describe("The Amazon Resource Name (ARN) of the SQS queue")
            }).optional(),
            eventBridge: z.object({
              accountId: z.string().describe("The AWS account ID of the event bridge")
            }).optional()
          }).describe("The destination resource specification")
        },
        handler: async ({ name, resourceSpecification }) => {
          log('DEBUG', 'createDestination handler entry');
          log('DEBUG', 'Input parameters', { 
            name,
            resourceSpecification
          });
          
          try {
            const payload = {
              name,
              resourceSpecification
            };
            
            log('DEBUG', 'Payload created', payload);
            
            log('DEBUG', 'Making SP-API request', {
              method: 'POST',
              endpoint: '/notifications/v1/destinations',
              payload
            });
            
            const data = await makeSpApiRequest(
              'POST',
              '/notifications/v1/destinations',
              payload
            );
            
            log('DEBUG', 'SP-API response received', {
              responseKeys: Object.keys(data || {}),
              destinationId: data?.destinationId || 'not found'
            });
            
            log('DEBUG', 'createDestination handler success');
            return {
              content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };
          } catch (error) {
            log('ERROR', 'createDestination handler error', {
              message: error.message,
              stack: error.stack,
              name
            });
            return {
              content: [{ type: "text", text: `Error creating destination: ${error.message}` }],
              isError: true
            };
          }
        },
        description: "Creates a destination resource to receive notifications"
      }
    };
