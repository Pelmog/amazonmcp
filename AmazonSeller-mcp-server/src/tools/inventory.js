import { z } from 'zod';
import { makeSpApiRequest } from '../utils/auth.js';
import { log as fileLog, logError } from '../utils/logger.js';

// Debug logging function
const log = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] [INVENTORY] ${message}`;
  if (level === 'ERROR') {
    logError(logMessage);
    if (data) {
      logError(`[${timestamp}] [${level}] [INVENTORY] Data:`, JSON.stringify(data, null, 2));
    }
  } else {
    fileLog(logMessage);
    if (data) {
      fileLog(`[${timestamp}] [${level}] [INVENTORY] Data:`, JSON.stringify(data, null, 2));
    }
  }
};

log('DEBUG', 'Inventory tools module loaded');

export const inventoryTools = {
      getInventorySummaries: {
        schema: {
          sellerSkus: z.array(z.string()).optional().describe("A list of seller SKUs to get inventory summaries for"),
          marketplaceId: z.string().optional().describe("The marketplace ID. Defaults to the one in environment variables"),
          granularityType: z.enum(['Marketplace', 'ASIN', 'Seller']).default('Marketplace').describe("The granularity type for the inventory aggregation level"),
          granularityId: z.string().optional().describe("The granularity ID for the inventory aggregation level")
        },
        handler: async ({ sellerSkus, marketplaceId, granularityType, granularityId }) => {
          log('DEBUG', 'getInventorySummaries handler entry');
          log('DEBUG', 'Input parameters', { 
            sellerSkus: sellerSkus || 'not provided',
            marketplaceId: marketplaceId || 'using default',
            granularityType,
            granularityId: granularityId || 'not provided'
          });
          
          try {
            const marketplace = marketplaceId || process.env.SP_API_MARKETPLACE_ID;
            const queryParams = {
              marketplaceIds: marketplace,
              granularityType
            };
            
            log('DEBUG', 'Initial query parameters', queryParams);
            
            if (granularityId) {
              queryParams.granularityId = granularityId;
            }
            
            if (sellerSkus && sellerSkus.length > 0) {
              queryParams.sellerSkus = sellerSkus.join(',');
            }
            
            log('DEBUG', 'Making SP-API request', {
              method: 'GET',
              endpoint: '/fba/inventory/v1/summaries',
              queryParams
            });
            
            const data = await makeSpApiRequest(
              'GET',
              '/fba/inventory/v1/summaries',
              null,
              queryParams
            );
            
            log('DEBUG', 'SP-API response received', {
              responseKeys: Object.keys(data || {}),
              summariesCount: data?.inventorySummaries?.length || 0
            });
            
            log('DEBUG', 'getInventorySummaries handler success');
            return {
              content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };
          } catch (error) {
            log('ERROR', 'getInventorySummaries handler error', {
              message: error.message,
              stack: error.stack,
              sellerSkus
            });
            return {
              content: [{ type: "text", text: `Error retrieving inventory summaries: ${error.message}` }],
              isError: true
            };
          }
        },
        description: "Get inventory summaries for the specified seller SKUs"
      },
      
      updateInventory: {
        schema: {
          sellerSku: z.string().describe("The seller SKU for which to update the inventory"),
          quantity: z.number().int().describe("The new available quantity"),
          fulfillmentLatency: z.number().int().optional().describe("The new fulfillment latency in days")
        },
        handler: async ({ sellerSku, quantity, fulfillmentLatency }) => {
          log('DEBUG', 'updateInventory handler entry');
          log('DEBUG', 'Input parameters', { 
            sellerSku,
            quantity,
            fulfillmentLatency: fulfillmentLatency || 'not provided'
          });
          
          try {
            const payload = {
              inventory: {
                sellerSku,
                availableQuantity: quantity
              }
            };
            
            log('DEBUG', 'Initial payload', payload);
            
            if (fulfillmentLatency !== undefined) {
              payload.inventory.fulfillmentLatency = fulfillmentLatency;
            }
            
            log('DEBUG', 'Making SP-API request', {
              method: 'PUT',
              endpoint: `/inventory/v1/inventories/${sellerSku}`,
              payload
            });
            
            const data = await makeSpApiRequest(
              'PUT',
              `/inventory/v1/inventories/${sellerSku}`,
              payload
            );
            
            log('DEBUG', 'SP-API response received', {
              responseKeys: Object.keys(data || {})
            });
            
            log('DEBUG', 'updateInventory handler success');
            return {
              content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };
          } catch (error) {
            log('ERROR', 'updateInventory handler error', {
              message: error.message,
              stack: error.stack,
              sellerSku,
              quantity
            });
            return {
              content: [{ type: "text", text: `Error updating inventory: ${error.message}` }],
              isError: true
            };
          }
        },
        description: "Update the inventory level for a specific SKU"
      }
    };
