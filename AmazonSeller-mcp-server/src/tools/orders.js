import { z } from 'zod';
import { makeSpApiRequest } from '../utils/auth.js';
import { log as fileLog, logError } from '../utils/logger.js';

// Debug logging function
const log = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] [ORDERS] ${message}`;
  if (level === 'ERROR') {
    logError(logMessage);
    if (data) {
      logError(`[${timestamp}] [${level}] [ORDERS] Data:`, JSON.stringify(data, null, 2));
    }
  } else {
    fileLog(logMessage);
    if (data) {
      fileLog(`[${timestamp}] [${level}] [ORDERS] Data:`, JSON.stringify(data, null, 2));
    }
  }
};

log('DEBUG', 'Orders tools module loaded');

export const ordersTools = {
      getOrders: {
        schema: {
          createdAfter: z.string().optional().describe("Orders created after this date (ISO 8601 format)"),
          createdBefore: z.string().optional().describe("Orders created before this date (ISO 8601 format)"),
          orderStatuses: z.array(z.string()).optional().describe("Filter by order status"),
          marketplaceIds: z.array(z.string()).optional().describe("List of marketplace IDs")
        },
        handler: async ({ createdAfter, createdBefore, orderStatuses, marketplaceIds }) => {
          log('DEBUG', 'getOrders handler entry');
          log('DEBUG', 'Input parameters', { 
            createdAfter: createdAfter || 'not provided', 
            createdBefore: createdBefore || 'not provided',
            orderStatuses: orderStatuses || 'not provided',
            marketplaceIds: marketplaceIds || 'not provided'
          });
          
          try {
            const queryParams = {
              MarketplaceIds: marketplaceIds || [process.env.SP_API_MARKETPLACE_ID]
            };
            
            log('DEBUG', 'Initial query parameters', queryParams);
            
            if (createdAfter) {
              queryParams.CreatedAfter = createdAfter;
            }
            
            if (createdBefore) {
              queryParams.CreatedBefore = createdBefore;
            }
            
            if (orderStatuses && orderStatuses.length > 0) {
              queryParams.OrderStatuses = orderStatuses.join(',');
            }
            
            log('DEBUG', 'Making SP-API request', {
              method: 'GET',
              endpoint: '/orders/v0/orders',
              queryParams
            });
            
            const data = await makeSpApiRequest(
              'GET',
              '/orders/v0/orders',
              null,
              queryParams
            );
            
            log('DEBUG', 'SP-API response received', {
              responseKeys: Object.keys(data || {}),
              ordersCount: data?.orders?.length || 0
            });
            
            log('DEBUG', 'getOrders handler success');
            return {
              content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };
          } catch (error) {
            log('ERROR', 'getOrders handler error', {
              message: error.message,
              stack: error.stack,
              name: error.name
            });
            return {
              content: [{ type: "text", text: `Error retrieving orders: ${error.message}` }],
              isError: true
            };
          }
        },
        description: "Get orders based on specified filters"
      },
      
      getOrder: {
        schema: {
          orderId: z.string().describe("The order ID")
        },
        handler: async ({ orderId }) => {
          log('DEBUG', 'getOrder handler entry');
          log('DEBUG', 'Input parameters', { orderId });
          
          try {
            log('DEBUG', 'Making SP-API request', {
              method: 'GET',
              endpoint: `/orders/v0/orders/${orderId}`
            });
            
            const data = await makeSpApiRequest(
              'GET',
              `/orders/v0/orders/${orderId}`
            );
            
            log('DEBUG', 'SP-API response received', {
              responseKeys: Object.keys(data || {}),
              orderId: data?.orderId || 'not found'
            });
            
            log('DEBUG', 'getOrder handler success');
            return {
              content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };
          } catch (error) {
            log('ERROR', 'getOrder handler error', {
              message: error.message,
              stack: error.stack,
              orderId
            });
            return {
              content: [{ type: "text", text: `Error retrieving order: ${error.message}` }],
              isError: true
            };
          }
        },
        description: "Get details for a specific order"
      },
      
      getOrderItems: {
        schema: {
          orderId: z.string().describe("The order ID")
        },
        handler: async ({ orderId }) => {
          log('DEBUG', 'getOrderItems handler entry');
          log('DEBUG', 'Input parameters', { orderId });
          
          try {
            log('DEBUG', 'Making SP-API request', {
              method: 'GET',
              endpoint: `/orders/v0/orders/${orderId}/orderItems`
            });
            
            const data = await makeSpApiRequest(
              'GET',
              `/orders/v0/orders/${orderId}/orderItems`
            );
            
            log('DEBUG', 'SP-API response received', {
              responseKeys: Object.keys(data || {}),
              itemsCount: data?.orderItems?.length || 0
            });
            
            log('DEBUG', 'getOrderItems handler success');
            return {
              content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };
          } catch (error) {
            log('ERROR', 'getOrderItems handler error', {
              message: error.message,
              stack: error.stack,
              orderId
            });
            return {
              content: [{ type: "text", text: `Error retrieving order items: ${error.message}` }],
              isError: true
            };
          }
        },
        description: "Get items for a specific order"
      }
    };
