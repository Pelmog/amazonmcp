import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
    import { log, logError } from './utils/logger.js';
    import { catalogTools } from './tools/catalog.js';
    import { inventoryTools } from './tools/inventory.js';
    import { ordersTools } from './tools/orders.js';
    import { reportsTools } from './tools/reports.js';
    import { feedsTools } from './tools/feeds.js';
    import { financeTools } from './tools/finance.js';
    import { notificationsTools } from './tools/notifications.js';
    import { authTools } from './tools/auth.js';
    import { sellerTools } from './tools/seller.js';
    import { fbaTools } from './tools/fba.js';
    import { productPricingTools } from './tools/product-pricing.js';
    import { listingsTools } from './tools/listings.js';
    import { apiDocs } from './resources/api-docs.js';

    log('[DEBUG] Importing tool modules completed');
    log('[DEBUG] Available tool modules:', {
      catalogTools: Object.keys(catalogTools),
      inventoryTools: Object.keys(inventoryTools),
      ordersTools: Object.keys(ordersTools),
      reportsTools: Object.keys(reportsTools),
      feedsTools: Object.keys(feedsTools),
      financeTools: Object.keys(financeTools),
      notificationsTools: Object.keys(notificationsTools),
      authTools: Object.keys(authTools),
      sellerTools: Object.keys(sellerTools),
      fbaTools: Object.keys(fbaTools),
      productPricingTools: Object.keys(productPricingTools),
      listingsTools: Object.keys(listingsTools)
    });

    // Create an MCP server for Amazon SP-API
    log('[DEBUG] Creating MCP server instance...');
    const server = new McpServer({
      name: "Amazon Selling Partner API",
      version: "1.0.0",
      description: "MCP Server for interacting with Amazon Selling Partner API"
    });
    log('[DEBUG] MCP server instance created successfully');

    // Register all tools
    const registerToolsFromModule = (toolsModule, moduleName) => {
      log(`[DEBUG] Registering tools from ${moduleName}:`, Object.keys(toolsModule));
      Object.entries(toolsModule).forEach(([name, toolConfig]) => {
        log(`[DEBUG] Registering tool: ${name} from ${moduleName}`);
        try {
          server.tool(
            name,
            toolConfig.schema,
            toolConfig.handler,
            { description: toolConfig.description }
          );
          log(`[DEBUG] Successfully registered tool: ${name}`);
        } catch (error) {
          logError(`[ERROR] Failed to register tool ${name}:`, error);
        }
      });
      log(`[DEBUG] Completed registering tools from ${moduleName}`);
    };

    // Register API documentation resources
    log('[DEBUG] Registering API documentation resources...');
    log('[DEBUG] Available API doc categories:', Object.keys(apiDocs));
    server.resource(
      "api_docs",
      new ResourceTemplate("amazon-sp-api://{category}", { list: undefined }),
      async (uri, { category }) => {
        log(`[DEBUG] API docs requested for category: ${category}`);
        if (!apiDocs[category]) {
          log(`[DEBUG] Category ${category} not found. Available:`, Object.keys(apiDocs));
          return {
            contents: [{
              uri: uri.href,
              text: `Documentation for category '${category}' not found. Available categories: ${Object.keys(apiDocs).join(', ')}`
            }]
          };
        }
        
        log(`[DEBUG] Returning documentation for category: ${category}`);
        return {
          contents: [{
            uri: uri.href,
            text: apiDocs[category]
          }]
        };
      }
    );
    log('[DEBUG] API documentation resources registered successfully');

    // Register all tool modules
    log('[DEBUG] Starting tool module registration...');
    registerToolsFromModule(authTools, 'authTools');
    registerToolsFromModule(catalogTools, 'catalogTools');
    registerToolsFromModule(inventoryTools, 'inventoryTools');
    registerToolsFromModule(ordersTools, 'ordersTools');
    registerToolsFromModule(reportsTools, 'reportsTools');
    registerToolsFromModule(feedsTools, 'feedsTools');
    registerToolsFromModule(financeTools, 'financeTools');
    registerToolsFromModule(notificationsTools, 'notificationsTools');
    registerToolsFromModule(sellerTools, 'sellerTools');
    registerToolsFromModule(fbaTools, 'fbaTools');
    registerToolsFromModule(productPricingTools, 'productPricingTools');
    registerToolsFromModule(listingsTools, 'listingsTools');
    log('[DEBUG] All tool modules registered successfully');

    export { server };
