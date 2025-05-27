import { z } from 'zod';
import { makeSpApiRequest } from '../utils/auth.js';
import { log as fileLog, logError } from '../utils/logger.js';

// Debug logging function
const log = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] [LISTINGS] ${message}`;
  if (level === 'ERROR') {
    logError(logMessage);
    if (data) {
      logError(`[${timestamp}] [${level}] [LISTINGS] Data:`, JSON.stringify(data, null, 2));
    }
  } else {
    fileLog(logMessage);
    if (data) {
      fileLog(`[${timestamp}] [${level}] [LISTINGS] Data:`, JSON.stringify(data, null, 2));
    }
  }
};

log('DEBUG', 'Listings tools module loaded');

export const listingsTools = {
      getListingsItem: {
        schema: {
          sellerId: z.string().describe("The seller identifier"),
          sku: z.string().describe("The seller SKU of the listings item"),
          marketplaceIds: z.array(z.string()).optional().describe("A list of marketplace identifiers"),
          issueLocale: z.string().optional().describe("A locale for localization of issues")
        },
        handler: async ({ sellerId, sku, marketplaceIds, issueLocale }) => {
          log('DEBUG', 'getListingsItem handler entry');
          log('DEBUG', 'Input parameters', { 
            sellerId,
            sku,
            marketplaceIds: marketplaceIds || 'using default',
            issueLocale: issueLocale || 'not provided'
          });
          
          try {
            const queryParams = {
              marketplaceIds: marketplaceIds || [process.env.SP_API_MARKETPLACE_ID]
            };
            
            log('DEBUG', 'Initial query parameters', queryParams);
            
            if (issueLocale) {
              queryParams.issueLocale = issueLocale;
            }
            
            log('DEBUG', 'Making SP-API request', {
              method: 'GET',
              endpoint: `/listings/2021-08-01/items/${sellerId}/${sku}`,
              queryParams
            });
            
            const data = await makeSpApiRequest(
              'GET',
              `/listings/2021-08-01/items/${sellerId}/${sku}`,
              null,
              queryParams
            );
            
            log('DEBUG', 'SP-API response received', {
              responseKeys: Object.keys(data || {}),
              sku: data?.sku || 'not found'
            });
            
            log('DEBUG', 'getListingsItem handler success');
            return {
              content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };
          } catch (error) {
            log('ERROR', 'getListingsItem handler error', {
              message: error.message,
              stack: error.stack,
              sellerId,
              sku
            });
            return {
              content: [{ type: "text", text: `Error getting listings item: ${error.message}` }],
              isError: true
            };
          }
        },
        description: "Returns details about a listings item for a selling partner"
      },
      
      putListingsItem: {
        schema: {
          sellerId: z.string().describe("The seller identifier"),
          sku: z.string().describe("The seller SKU of the listings item"),
          marketplaceIds: z.array(z.string()).optional().describe("A list of marketplace identifiers"),
          issueLocale: z.string().optional().describe("A locale for localization of issues"),
          productType: z.string().describe("The Amazon product type of the listings item"),
          requirements: z.string().optional().describe("The name of the requirements set for the provided data"),
          attributes: z.record(z.any()).describe("JSON object containing structured listings item attribute data")
        },
        handler: async ({ sellerId, sku, marketplaceIds, issueLocale, productType, requirements, attributes }) => {
          log('DEBUG', 'putListingsItem handler entry');
          log('DEBUG', 'Input parameters', { 
            sellerId,
            sku,
            marketplaceIds: marketplaceIds || 'using default',
            issueLocale: issueLocale || 'not provided',
            productType,
            requirements: requirements || 'not provided',
            attributes: attributes ? 'provided' : 'not provided'
          });
          
          try {
            const queryParams = {
              marketplaceIds: marketplaceIds || [process.env.SP_API_MARKETPLACE_ID]
            };
            
            log('DEBUG', 'Initial query parameters', queryParams);
            
            if (issueLocale) {
              queryParams.issueLocale = issueLocale;
            }
            
            if (requirements) {
              queryParams.requirements = requirements;
            }
            
            const payload = {
              productType,
              attributes
            };
            
            log('DEBUG', 'Payload created', {
              productType,
              attributesProvided: attributes ? true : false
            });
            
            log('DEBUG', 'Making SP-API request', {
              method: 'PUT',
              endpoint: `/listings/2021-08-01/items/${sellerId}/${sku}`,
              payload: {
                productType,
                attributesProvided: attributes ? true : false
              },
              queryParams
            });
            
            const data = await makeSpApiRequest(
              'PUT',
              `/listings/2021-08-01/items/${sellerId}/${sku}`,
              payload,
              queryParams
            );
            
            log('DEBUG', 'SP-API response received', {
              responseKeys: Object.keys(data || {})
            });
            
            log('DEBUG', 'putListingsItem handler success');
            return {
              content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };
          } catch (error) {
            log('ERROR', 'putListingsItem handler error', {
              message: error.message,
              stack: error.stack,
              sellerId,
              sku,
              productType
            });
            return {
              content: [{ type: "text", text: `Error updating listings item: ${error.message}` }],
              isError: true
            };
          }
        },
        description: "Creates or updates a listings item for a selling partner"
      },
      
      deleteListingsItem: {
        schema: {
          sellerId: z.string().describe("The seller identifier"),
          sku: z.string().describe("The seller SKU of the listings item"),
          marketplaceIds: z.array(z.string()).optional().describe("A list of marketplace identifiers"),
          issueLocale: z.string().optional().describe("A locale for localization of issues")
        },
        handler: async ({ sellerId, sku, marketplaceIds, issueLocale }) => {
          log('DEBUG', 'deleteListingsItem handler entry');
          log('DEBUG', 'Input parameters', { 
            sellerId,
            sku,
            marketplaceIds: marketplaceIds || 'using default',
            issueLocale: issueLocale || 'not provided'
          });
          
          try {
            const queryParams = {
              marketplaceIds: marketplaceIds || [process.env.SP_API_MARKETPLACE_ID]
            };
            
            log('DEBUG', 'Query parameters created', queryParams);
            
            if (issueLocale) {
              queryParams.issueLocale = issueLocale;
            }
            
            log('DEBUG', 'Making SP-API request', {
              method: 'DELETE',
              endpoint: `/listings/2021-08-01/items/${sellerId}/${sku}`,
              queryParams
            });
            
            const data = await makeSpApiRequest(
              'DELETE',
              `/listings/2021-08-01/items/${sellerId}/${sku}`,
              null,
              queryParams
            );
            
            log('DEBUG', 'SP-API response received', {
              responseKeys: Object.keys(data || {})
            });
            
            log('DEBUG', 'deleteListingsItem handler success');
            return {
              content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };
          } catch (error) {
            log('ERROR', 'deleteListingsItem handler error', {
              message: error.message,
              stack: error.stack,
              sellerId,
              sku
            });
            return {
              content: [{ type: "text", text: `Error deleting listings item: ${error.message}` }],
              isError: true
            };
          }
        },
        description: "Deletes a listings item for a selling partner"
      }
    };
