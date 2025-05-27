import { z } from 'zod';
import { makeSpApiRequest } from '../utils/auth.js';
import { log as fileLog, logError } from '../utils/logger.js';

// Debug logging function
const log = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] [FINANCE] ${message}`;
  if (level === 'ERROR') {
    logError(logMessage);
    if (data) {
      logError(`[${timestamp}] [${level}] [FINANCE] Data:`, JSON.stringify(data, null, 2));
    }
  } else {
    fileLog(logMessage);
    if (data) {
      fileLog(`[${timestamp}] [${level}] [FINANCE] Data:`, JSON.stringify(data, null, 2));
    }
  }
};

log('DEBUG', 'Finance tools module loaded');

export const financeTools = {
      listFinancialEventGroups: {
        schema: {
          maxResultsPerPage: z.number().int().optional().describe("The maximum number of results to return per page"),
          financialEventGroupStartedAfter: z.string().optional().describe("A date used for selecting financial event groups that opened after (or at) a specified date and time"),
          financialEventGroupStartedBefore: z.string().optional().describe("A date used for selecting financial event groups that opened before (or at) a specified date and time")
        },
        handler: async ({ maxResultsPerPage, financialEventGroupStartedAfter, financialEventGroupStartedBefore }) => {
          log('DEBUG', 'listFinancialEventGroups handler entry');
          log('DEBUG', 'Input parameters', { 
            maxResultsPerPage: maxResultsPerPage || 'not provided',
            financialEventGroupStartedAfter: financialEventGroupStartedAfter || 'not provided',
            financialEventGroupStartedBefore: financialEventGroupStartedBefore || 'not provided'
          });
          
          try {
            const queryParams = {};
            
            log('DEBUG', 'Building query parameters');
            
            if (maxResultsPerPage) {
              queryParams.MaxResultsPerPage = maxResultsPerPage;
            }
            
            if (financialEventGroupStartedAfter) {
              queryParams.FinancialEventGroupStartedAfter = financialEventGroupStartedAfter;
            }
            
            if (financialEventGroupStartedBefore) {
              queryParams.FinancialEventGroupStartedBefore = financialEventGroupStartedBefore;
            }
            
            log('DEBUG', 'Making SP-API request', {
              method: 'GET',
              endpoint: '/finances/v0/financialEventGroups',
              queryParams
            });
            
            const data = await makeSpApiRequest(
              'GET',
              '/finances/v0/financialEventGroups',
              null,
              queryParams
            );
            
            log('DEBUG', 'SP-API response received', {
              responseKeys: Object.keys(data || {}),
              groupsCount: data?.financialEventGroupList?.length || 0
            });
            
            log('DEBUG', 'listFinancialEventGroups handler success');
            return {
              content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };
          } catch (error) {
            log('ERROR', 'listFinancialEventGroups handler error', {
              message: error.message,
              stack: error.stack
            });
            return {
              content: [{ type: "text", text: `Error listing financial event groups: ${error.message}` }],
              isError: true
            };
          }
        },
        description: "Lists financial event groups"
      },
      
      listFinancialEvents: {
        schema: {
          maxResultsPerPage: z.number().int().optional().describe("The maximum number of results to return per page"),
          postedAfter: z.string().optional().describe("A date used for selecting financial events posted after (or at) a specified date and time"),
          postedBefore: z.string().optional().describe("A date used for selecting financial events posted before (or at) a specified date and time")
        },
        handler: async ({ maxResultsPerPage, postedAfter, postedBefore }) => {
          log('DEBUG', 'listFinancialEvents handler entry');
          log('DEBUG', 'Input parameters', { 
            maxResultsPerPage: maxResultsPerPage || 'not provided',
            postedAfter: postedAfter || 'not provided',
            postedBefore: postedBefore || 'not provided'
          });
          
          try {
            const queryParams = {};
            
            log('DEBUG', 'Building query parameters');
            
            if (maxResultsPerPage) {
              queryParams.MaxResultsPerPage = maxResultsPerPage;
            }
            
            if (postedAfter) {
              queryParams.PostedAfter = postedAfter;
            }
            
            if (postedBefore) {
              queryParams.PostedBefore = postedBefore;
            }
            
            log('DEBUG', 'Making SP-API request', {
              method: 'GET',
              endpoint: '/finances/v0/financialEvents',
              queryParams
            });
            
            const data = await makeSpApiRequest(
              'GET',
              '/finances/v0/financialEvents',
              null,
              queryParams
            );
            
            log('DEBUG', 'SP-API response received', {
              responseKeys: Object.keys(data || {}),
              eventsCount: data?.financialEvents?.length || 0
            });
            
            log('DEBUG', 'listFinancialEvents handler success');
            return {
              content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };
          } catch (error) {
            log('ERROR', 'listFinancialEvents handler error', {
              message: error.message,
              stack: error.stack
            });
            return {
              content: [{ type: "text", text: `Error listing financial events: ${error.message}` }],
              isError: true
            };
          }
        },
        description: "Lists financial events"
      },
      
      getFinancialEventGroup: {
        schema: {
          eventGroupId: z.string().describe("The identifier of the financial event group to which the events belong")
        },
        handler: async ({ eventGroupId }) => {
          log('DEBUG', 'getFinancialEventGroup handler entry');
          log('DEBUG', 'Input parameters', { eventGroupId });
          
          try {
            log('DEBUG', 'Making SP-API request', {
              method: 'GET',
              endpoint: `/finances/v0/financialEventGroups/${eventGroupId}/financialEvents`
            });
            
            const data = await makeSpApiRequest(
              'GET',
              `/finances/v0/financialEventGroups/${eventGroupId}/financialEvents`
            );
            
            log('DEBUG', 'SP-API response received', {
              responseKeys: Object.keys(data || {}),
              eventsCount: data?.financialEvents?.length || 0
            });
            
            log('DEBUG', 'getFinancialEventGroup handler success');
            return {
              content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };
          } catch (error) {
            log('ERROR', 'getFinancialEventGroup handler error', {
              message: error.message,
              stack: error.stack,
              eventGroupId
            });
            return {
              content: [{ type: "text", text: `Error getting financial event group: ${error.message}` }],
              isError: true
            };
          }
        },
        description: "Returns all financial events for the specified financial event group"
      }
    };
