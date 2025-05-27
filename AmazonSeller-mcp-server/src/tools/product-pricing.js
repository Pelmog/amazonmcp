import { z } from 'zod';
import { makeSpApiRequest } from '../utils/auth.js';
import { log as fileLog, logError } from '../utils/logger.js';

// Debug logging function
const log = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] [PRODUCT_PRICING] ${message}`;
  if (level === 'ERROR') {
    logError(logMessage);
    if (data) {
      logError(`[${timestamp}] [${level}] [PRODUCT_PRICING] Data:`, JSON.stringify(data, null, 2));
    }
  } else {
    fileLog(logMessage);
    if (data) {
      fileLog(`[${timestamp}] [${level}] [PRODUCT_PRICING] Data:`, JSON.stringify(data, null, 2));
    }
  }
};

log('DEBUG', 'Product pricing tools module loaded');

export const productPricingTools = {
      getPricing: {
        schema: {
          itemType: z.enum(['Asin', 'Sku']).describe("Indicates whether ASIN values or seller SKU values are used to identify items"),
          itemIds: z.array(z.string()).describe("A list of item identifiers"),
          marketplaceId: z.string().optional().describe("The marketplace ID. Defaults to the one in environment variables")
        },
        handler: async ({ itemType, itemIds, marketplaceId }) => {
          log('DEBUG', 'getPricing handler entry');
          log('DEBUG', 'Input parameters', { 
            itemType,
            itemIds,
            marketplaceId: marketplaceId || 'using default'
          });
          
          try {
            const marketplace = marketplaceId || process.env.SP_API_MARKETPLACE_ID;
            const queryParams = {
              ItemType: itemType,
              ItemIds: itemIds.join(','),
              MarketplaceId: marketplace
            };
            
            log('DEBUG', 'Query parameters created', queryParams);
            
            log('DEBUG', 'Making SP-API request', {
              method: 'GET',
              endpoint: '/products/pricing/v0/price',
              queryParams
            });
            
            const data = await makeSpApiRequest(
              'GET',
              '/products/pricing/v0/price',
              null,
              queryParams
            );
            
            log('DEBUG', 'SP-API response received', {
              responseKeys: Object.keys(data || {}),
              itemsCount: itemIds.length
            });
            
            log('DEBUG', 'getPricing handler success');
            return {
              content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };
          } catch (error) {
            log('ERROR', 'getPricing handler error', {
              message: error.message,
              stack: error.stack,
              itemType,
              itemIdsCount: itemIds.length
            });
            return {
              content: [{ type: "text", text: `Error getting pricing: ${error.message}` }],
              isError: true
            };
          }
        },
        description: "Returns pricing information for a list of products"
      },
      
      getCompetitivePricing: {
        schema: {
          itemType: z.enum(['Asin', 'Sku']).describe("Indicates whether ASIN values or seller SKU values are used to identify items"),
          itemIds: z.array(z.string()).describe("A list of item identifiers"),
          marketplaceId: z.string().optional().describe("The marketplace ID. Defaults to the one in environment variables")
        },
        handler: async ({ itemType, itemIds, marketplaceId }) => {
          log('DEBUG', 'getCompetitivePricing handler entry');
          log('DEBUG', 'Input parameters', { 
            itemType,
            itemIds,
            marketplaceId: marketplaceId || 'using default'
          });
          
          try {
            const marketplace = marketplaceId || process.env.SP_API_MARKETPLACE_ID;
            const queryParams = {
              ItemType: itemType,
              ItemIds: itemIds.join(','),
              MarketplaceId: marketplace
            };
            
            log('DEBUG', 'Query parameters created', queryParams);
            
            log('DEBUG', 'Making SP-API request', {
              method: 'GET',
              endpoint: '/products/pricing/v0/competitivePrice',
              queryParams
            });
            
            const data = await makeSpApiRequest(
              'GET',
              '/products/pricing/v0/competitivePrice',
              null,
              queryParams
            );
            
            log('DEBUG', 'SP-API response received', {
              responseKeys: Object.keys(data || {}),
              itemsCount: itemIds.length
            });
            
            log('DEBUG', 'getCompetitivePricing handler success');
            return {
              content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };
          } catch (error) {
            log('ERROR', 'getCompetitivePricing handler error', {
              message: error.message,
              stack: error.stack,
              itemType,
              itemIdsCount: itemIds.length
            });
            return {
              content: [{ type: "text", text: `Error getting competitive pricing: ${error.message}` }],
              isError: true
            };
          }
        },
        description: "Returns competitive pricing information for a list of products"
      },
      
      getListingOffers: {
        schema: {
          sellerSku: z.string().describe("The seller SKU of the item"),
          marketplaceId: z.string().optional().describe("The marketplace ID. Defaults to the one in environment variables"),
          itemCondition: z.enum(['New', 'Used', 'Collectible', 'Refurbished', 'Club']).describe("The condition of the item")
        },
        handler: async ({ sellerSku, marketplaceId, itemCondition }) => {
          log('DEBUG', 'getListingOffers handler entry');
          log('DEBUG', 'Input parameters', { 
            sellerSku,
            marketplaceId: marketplaceId || 'using default',
            itemCondition
          });
          
          try {
            const marketplace = marketplaceId || process.env.SP_API_MARKETPLACE_ID;
            const queryParams = {
              MarketplaceId: marketplace,
              ItemCondition: itemCondition
            };
            
            log('DEBUG', 'Making SP-API request', {
              method: 'GET',
              endpoint: `/products/pricing/v0/listings/${sellerSku}/offers`,
              queryParams
            });
            
            const data = await makeSpApiRequest(
              'GET',
              `/products/pricing/v0/listings/${sellerSku}/offers`,
              null,
              queryParams
            );
            
            log('DEBUG', 'SP-API response received', {
              responseKeys: Object.keys(data || {}),
              offersCount: data?.payload?.Offers?.length || 0
            });
            
            log('DEBUG', 'getListingOffers handler success');
            return {
              content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };
          } catch (error) {
            log('ERROR', 'getListingOffers handler error', {
              message: error.message,
              stack: error.stack,
              sellerSku,
              itemCondition
            });
            return {
              content: [{ type: "text", text: `Error getting listing offers: ${error.message}` }],
              isError: true
            };
          }
        },
        description: "Returns the lowest priced offers for a single SKU listing"
      }
    };
