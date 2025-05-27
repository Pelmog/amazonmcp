import { z } from 'zod';
import { makeSpApiRequest } from '../utils/auth.js';
import { log as fileLog, logError } from '../utils/logger.js';

// Debug logging function
const log = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] [REPORTS] ${message}`;
  if (level === 'ERROR') {
    logError(logMessage);
    if (data) {
      logError(`[${timestamp}] [${level}] [REPORTS] Data:`, JSON.stringify(data, null, 2));
    }
  } else {
    fileLog(logMessage);
    if (data) {
      fileLog(`[${timestamp}] [${level}] [REPORTS] Data:`, JSON.stringify(data, null, 2));
    }
  }
};

log('DEBUG', 'Reports tools module loaded');

export const reportsTools = {
      createReport: {
        schema: {
          reportType: z.string().describe("The report type"),
          marketplaceIds: z.array(z.string()).optional().describe("List of marketplace IDs"),
          dataStartTime: z.string().optional().describe("The start of a date and time range, in ISO 8601 format"),
          dataEndTime: z.string().optional().describe("The end of a date and time range, in ISO 8601 format")
        },
        handler: async ({ reportType, marketplaceIds, dataStartTime, dataEndTime }) => {
          log('DEBUG', 'createReport handler entry');
          log('DEBUG', 'Input parameters', { 
            reportType,
            marketplaceIds: marketplaceIds || 'using default',
            dataStartTime: dataStartTime || 'not provided',
            dataEndTime: dataEndTime || 'not provided'
          });
          
          try {
            const payload = {
              reportType,
              marketplaceIds: marketplaceIds || [process.env.SP_API_MARKETPLACE_ID]
            };
            
            log('DEBUG', 'Initial payload', payload);
            
            if (dataStartTime) {
              payload.dataStartTime = dataStartTime;
            }
            
            if (dataEndTime) {
              payload.dataEndTime = dataEndTime;
            }
            
            log('DEBUG', 'Making SP-API request', {
              method: 'POST',
              endpoint: '/reports/2021-06-30/reports',
              payload
            });
            
            const data = await makeSpApiRequest(
              'POST',
              '/reports/2021-06-30/reports',
              payload
            );
            
            log('DEBUG', 'SP-API response received', {
              responseKeys: Object.keys(data || {}),
              reportId: data?.reportId || 'not found'
            });
            
            log('DEBUG', 'createReport handler success');
            return {
              content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };
          } catch (error) {
            log('ERROR', 'createReport handler error', {
              message: error.message,
              stack: error.stack,
              reportType
            });
            return {
              content: [{ type: "text", text: `Error creating report: ${error.message}` }],
              isError: true
            };
          }
        },
        description: "Create a report request"
      },
      
      getReport: {
        schema: {
          reportId: z.string().describe("The report ID")
        },
        handler: async ({ reportId }) => {
          log('DEBUG', 'getReport handler entry');
          log('DEBUG', 'Input parameters', { reportId });
          
          try {
            log('DEBUG', 'Making SP-API request', {
              method: 'GET',
              endpoint: `/reports/2021-06-30/reports/${reportId}`
            });
            
            const data = await makeSpApiRequest(
              'GET',
              `/reports/2021-06-30/reports/${reportId}`
            );
            
            log('DEBUG', 'SP-API response received', {
              responseKeys: Object.keys(data || {}),
              reportId: data?.reportId || 'not found'
            });
            
            log('DEBUG', 'getReport handler success');
            return {
              content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };
          } catch (error) {
            log('ERROR', 'getReport handler error', {
              message: error.message,
              stack: error.stack,
              reportId
            });
            return {
              content: [{ type: "text", text: `Error retrieving report: ${error.message}` }],
              isError: true
            };
          }
        },
        description: "Get information about a report"
      },
      
      getReportDocument: {
        schema: {
          reportDocumentId: z.string().describe("The report document ID")
        },
        handler: async ({ reportDocumentId }) => {
          log('DEBUG', 'getReportDocument handler entry');
          log('DEBUG', 'Input parameters', { reportDocumentId });
          
          try {
            log('DEBUG', 'Making SP-API request', {
              method: 'GET',
              endpoint: `/reports/2021-06-30/documents/${reportDocumentId}`
            });
            
            const data = await makeSpApiRequest(
              'GET',
              `/reports/2021-06-30/documents/${reportDocumentId}`
            );
            
            log('DEBUG', 'SP-API response received', {
              responseKeys: Object.keys(data || {}),
              documentId: data?.reportDocumentId || 'not found'
            });
            
            log('DEBUG', 'getReportDocument handler success');
            return {
              content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };
          } catch (error) {
            log('ERROR', 'getReportDocument handler error', {
              message: error.message,
              stack: error.stack,
              reportDocumentId
            });
            return {
              content: [{ type: "text", text: `Error retrieving report document: ${error.message}` }],
              isError: true
            };
          }
        },
        description: "Get information about a report document"
      },
      
      getReports: {
        schema: {
          reportTypes: z.array(z.string()).optional().describe("A list of report types"),
          processingStatuses: z.array(z.string()).optional().describe("A list of processing statuses"),
          marketplaceIds: z.array(z.string()).optional().describe("A list of marketplace IDs"),
          maxResults: z.number().int().optional().describe("Maximum number of results to return")
        },
        handler: async ({ reportTypes, processingStatuses, marketplaceIds, maxResults }) => {
          log('DEBUG', 'getReports handler entry');
          log('DEBUG', 'Input parameters', { 
            reportTypes: reportTypes || 'not provided',
            processingStatuses: processingStatuses || 'not provided',
            marketplaceIds: marketplaceIds || 'not provided',
            maxResults: maxResults || 'not provided'
          });
          
          try {
            const queryParams = {};
            
            log('DEBUG', 'Building query parameters');
            
            if (reportTypes && reportTypes.length > 0) {
              queryParams.reportTypes = reportTypes.join(',');
            }
            
            if (processingStatuses && processingStatuses.length > 0) {
              queryParams.processingStatuses = processingStatuses.join(',');
            }
            
            if (marketplaceIds && marketplaceIds.length > 0) {
              queryParams.marketplaceIds = marketplaceIds.join(',');
            }
            
            if (maxResults) {
              queryParams.maxResults = maxResults;
            }
            
            log('DEBUG', 'Making SP-API request', {
              method: 'GET',
              endpoint: '/reports/2021-06-30/reports',
              queryParams
            });
            
            const data = await makeSpApiRequest(
              'GET',
              '/reports/2021-06-30/reports',
              null,
              queryParams
            );
            
            log('DEBUG', 'SP-API response received', {
              responseKeys: Object.keys(data || {}),
              reportsCount: data?.reports?.length || 0
            });
            
            log('DEBUG', 'getReports handler success');
            return {
              content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
            };
          } catch (error) {
            log('ERROR', 'getReports handler error', {
              message: error.message,
              stack: error.stack
            });
            return {
              content: [{ type: "text", text: `Error retrieving reports: ${error.message}` }],
              isError: true
            };
          }
        },
        description: "Get a list of reports"
      }
    };
