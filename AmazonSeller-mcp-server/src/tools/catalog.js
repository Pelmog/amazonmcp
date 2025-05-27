import { z } from 'zod';
import { makeSpApiRequest } from '../utils/auth.js';
import { log as fileLog, logError } from '../utils/logger.js';

// Debug logging function
const log = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] [CATALOG] ${message}`;
  if (level === 'ERROR') {
    logError(logMessage);
    if (data) {
      logError(`[${timestamp}] [${level}] [CATALOG] Data:`, JSON.stringify(data, null, 2));
    }
  } else {
    fileLog(logMessage);
    if (data) {
      fileLog(`[${timestamp}] [${level}] [CATALOG] Data:`, JSON.stringify(data, null, 2));
    }
  }
};

log('DEBUG', 'Catalog tools module loaded');

export const catalogTools = {
      getCatalogItem: {
        schema: {
          asin: z.string().describe("The Amazon Standard Identification Number (ASIN) of the item"),
          marketplaceId: z.string().optional().describe("The marketplace ID. Defaults to the one in environment variables")
        },
        handler: async ({ asin, marketplaceId }) => {
          log('DEBUG', 'getCatalogItem handler entry');
          log('DEBUG', 'Input parameters', { 
            asin,
            marketplaceId: marketplaceId || 'using default'
          });
          
          try {
            const marketplace = marketplaceId || process.env.SP_API_MARKETPLACE_ID;
            
            log('DEBUG', 'Making SP-API request', {
              method: 'GET',
              endpoint: `/catalog/2022-04-01/items/${asin}`,
              queryParams: { marketplaceIds: marketplace }
            });
            
            const data = await makeSpApiRequest(
              'GET',
              `/catalog/2022-04-01/items/${asin}`,
              null,
              { marketplaceIds: marketplace }
            );
            
            log('DEBUG', 'SP-API response received', {
              responseKeys: Object.keys(data || {}),
              asin: data?.asin || 'not found'
            });
            
            log('DEBUG', 'getCatalogItem handler success');
            return {
              content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };
          } catch (error) {
            log('ERROR', 'getCatalogItem handler error', {
              message: error.message,
              stack: error.stack,
              asin
            });
            return {
              content: [{ type: "text", text: `Error retrieving catalog item: ${error.message}` }],
              isError: true
            };
          }
        },
        description: "Get details about a specific catalog item by ASIN"
      },
      
      searchCatalogItems: {
        schema: {
          keywords: z.string().describe("Keywords to search for"),
          marketplaceId: z.string().optional().describe("The marketplace ID. Defaults to the one in environment variables"),
          includedData: z.array(z.string()).optional().describe("Additional data to include in the response")
        },
        handler: async ({ keywords, marketplaceId, includedData }) => {
          log('DEBUG', 'searchCatalogItems handler entry');
          log('DEBUG', 'Input parameters', { 
            keywords,
            marketplaceId: marketplaceId || 'using default',
            includedData: includedData || 'not provided'
          });
          
          try {
            const marketplace = marketplaceId || process.env.SP_API_MARKETPLACE_ID;
            const queryParams = {
              keywords,
              marketplaceIds: marketplace
            };
            
            log('DEBUG', 'Initial query parameters', queryParams);
            
            if (includedData && includedData.length > 0) {
              queryParams.includedData = includedData.join(',');
            }
            
            log('DEBUG', 'Making SP-API request', {
              method: 'GET',
              endpoint: '/catalog/2022-04-01/items',
              queryParams
            });
            
            const data = await makeSpApiRequest(
              'GET',
              '/catalog/2022-04-01/items',
              null,
              queryParams
            );
            
            log('DEBUG', 'SP-API response received', {
              responseKeys: Object.keys(data || {}),
              itemsCount: data?.items?.length || 0
            });
            
            log('DEBUG', 'searchCatalogItems handler success');
            return {
              content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };
          } catch (error) {
            log('ERROR', 'searchCatalogItems handler error', {
              message: error.message,
              stack: error.stack,
              keywords
            });
            return {
              content: [{ type: "text", text: `Error searching catalog items: ${error.message}` }],
              isError: true
            };
          }
        },
        description: "Search for catalog items by keywords"
      }
    };
