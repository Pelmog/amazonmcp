import { z } from 'zod';
import { makeSpApiRequest } from '../utils/auth.js';
import { log as fileLog, logError } from '../utils/logger.js';

// Debug logging function
const log = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] [FBA] ${message}`;
  if (level === 'ERROR') {
    logError(logMessage);
    if (data) {
      logError(`[${timestamp}] [${level}] [FBA] Data:`, JSON.stringify(data, null, 2));
    }
  } else {
    fileLog(logMessage);
    if (data) {
      fileLog(`[${timestamp}] [${level}] [FBA] Data:`, JSON.stringify(data, null, 2));
    }
  }
};

log('DEBUG', 'FBA tools module loaded');

export const fbaTools = {
      getInboundEligibility: {
        schema: {
          asin: z.string().describe("The ASIN of the item"),
          programType: z.enum(['INBOUND', 'COMMINGLING']).describe("The program type to check eligibility against"),
          marketplaceId: z.string().optional().describe("The marketplace ID. Defaults to the one in environment variables")
        },
        handler: async ({ asin, programType, marketplaceId }) => {
          log('DEBUG', 'getInboundEligibility handler entry');
          log('DEBUG', 'Input parameters', { 
            asin,
            programType,
            marketplaceId: marketplaceId || 'using default'
          });
          
          try {
            const marketplace = marketplaceId || process.env.SP_API_MARKETPLACE_ID;
            const queryParams = {
              asin,
              program: programType,
              marketplaceIds: marketplace
            };
            
            log('DEBUG', 'Making SP-API request', {
              method: 'GET',
              endpoint: '/fba/inbound/v1/eligibility/inboundEligibility',
              queryParams
            });
            
            const data = await makeSpApiRequest(
              'GET',
              '/fba/inbound/v1/eligibility/inboundEligibility',
              null,
              queryParams
            );
            
            log('DEBUG', 'SP-API response received', {
              responseKeys: Object.keys(data || {}),
              isEligible: data?.isEligible
            });
            
            log('DEBUG', 'getInboundEligibility handler success');
            return {
              content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };
          } catch (error) {
            log('ERROR', 'getInboundEligibility handler error', {
              message: error.message,
              stack: error.stack,
              asin,
              programType
            });
            return {
              content: [{ type: "text", text: `Error getting inbound eligibility: ${error.message}` }],
              isError: true
            };
          }
        },
        description: "Returns the eligibility status of an item for the specified program"
      },
      
      getFbaInventorySummaries: {
        schema: {
          details: z.boolean().optional().describe("When true, returns inventory summaries with additional summarized inventory details"),
          granularityType: z.enum(['Marketplace', 'ASIN', 'Seller']).describe("The granularity type for the inventory aggregation level"),
          granularityId: z.string().optional().describe("The granularity ID for the inventory aggregation level"),
          marketplaceId: z.string().optional().describe("The marketplace ID. Defaults to the one in environment variables")
        },
        handler: async ({ details, granularityType, granularityId, marketplaceId }) => {
          log('DEBUG', 'getFbaInventorySummaries handler entry');
          log('DEBUG', 'Input parameters', { 
            details,
            granularityType,
            granularityId: granularityId || 'not provided',
            marketplaceId: marketplaceId || 'using default'
          });
          
          try {
            const marketplace = marketplaceId || process.env.SP_API_MARKETPLACE_ID;
            const queryParams = {
              details: details ? 'true' : 'false',
              granularityType,
              marketplaceIds: marketplace
            };
            
            log('DEBUG', 'Initial query parameters', queryParams);
            
            if (granularityId) {
              queryParams.granularityId = granularityId;
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
            
            log('DEBUG', 'getFbaInventorySummaries handler success');
            return {
              content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };
          } catch (error) {
            log('ERROR', 'getFbaInventorySummaries handler error', {
              message: error.message,
              stack: error.stack,
              granularityType
            });
            return {
              content: [{ type: "text", text: `Error getting inventory summaries: ${error.message}` }],
              isError: true
            };
          }
        },
        description: "Returns a list of inventory summaries for the specified criteria"
      },
      
      getShipments: {
        schema: {
          shipmentStatusList: z.array(z.string()).optional().describe("A list of ShipmentStatus values"),
          marketplaceId: z.string().optional().describe("The marketplace ID. Defaults to the one in environment variables"),
          queryType: z.enum(['SHIPMENT', 'DATE_RANGE', 'NEXT_TOKEN']).describe("Indicates whether to return shipments based on the shipmentStatusList, the shipmentIdList, or a date range"),
          nextToken: z.string().optional().describe("A string token returned in the response to your previous request")
        },
        handler: async ({ shipmentStatusList, marketplaceId, queryType, nextToken }) => {
          log('DEBUG', 'getShipments handler entry');
          log('DEBUG', 'Input parameters', { 
            shipmentStatusList: shipmentStatusList || 'not provided',
            marketplaceId: marketplaceId || 'using default',
            queryType,
            nextToken: nextToken || 'not provided'
          });
          
          try {
            const marketplace = marketplaceId || process.env.SP_API_MARKETPLACE_ID;
            const queryParams = {
              QueryType: queryType,
              MarketplaceId: marketplace
            };
            
            log('DEBUG', 'Initial query parameters', queryParams);
            
            if (shipmentStatusList && shipmentStatusList.length > 0) {
              queryParams.ShipmentStatusList = shipmentStatusList.join(',');
            }
            
            if (nextToken) {
              queryParams.NextToken = nextToken;
            }
            
            log('DEBUG', 'Making SP-API request', {
              method: 'GET',
              endpoint: '/fba/inbound/v0/shipments',
              queryParams
            });
            
            const data = await makeSpApiRequest(
              'GET',
              '/fba/inbound/v0/shipments',
              null,
              queryParams
            );
            
            log('DEBUG', 'SP-API response received', {
              responseKeys: Object.keys(data || {}),
              shipmentsCount: data?.payload?.length || 0
            });
            
            log('DEBUG', 'getShipments handler success');
            return {
              content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };
          } catch (error) {
            log('ERROR', 'getShipments handler error', {
              message: error.message,
              stack: error.stack,
              queryType
            });
            return {
              content: [{ type: "text", text: `Error getting shipments: ${error.message}` }],
              isError: true
            };
          }
        },
        description: "Returns a list of inbound shipments based on the specified criteria"
      }
    };
