#!/usr/bin/env node
    import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
    import { server } from './server.js';
    import { log, logError } from './utils/logger.js';
    import dotenv from 'dotenv';

    // Load environment variables
    log('[DEBUG] Loading environment variables...');
    dotenv.config();
    log('[DEBUG] Environment variables loaded. NODE_ENV:', process.env.NODE_ENV);

    log('[DEBUG] Starting Amazon SP-API MCP server...');
    log('[DEBUG] Process PID:', process.pid);
    log('[DEBUG] Node version:', process.version);

    try {
      // Start receiving messages on stdin and sending messages on stdout
      log('[DEBUG] Creating StdioServerTransport...');
      const transport = new StdioServerTransport();
      
      log('[DEBUG] Connecting server to transport...');
      await server.connect(transport);
      log('[DEBUG] Server successfully connected and ready to receive requests');
    } catch (error) {
      logError('[ERROR] Failed to start MCP server:', error);
      logError('[ERROR] Stack trace:', error.stack);
      process.exit(1);
    }
