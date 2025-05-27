#!/usr/bin/env node
    import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
    import { server } from './server.js';
    import { log, logError, setLogLevel, getLogLevel } from './utils/logger.js';
    import dotenv from 'dotenv';

    // Parse command line arguments for log level
    const args = process.argv.slice(2);
    const logLevelIndex = args.findIndex(arg => arg === '--log-level' || arg === '-l');
    if (logLevelIndex !== -1 && args[logLevelIndex + 1]) {
      const requestedLevel = args[logLevelIndex + 1];
      if (setLogLevel(requestedLevel)) {
        // Log level set successfully via command line
      } else {
        console.error(`Invalid log level: ${requestedLevel}. Valid levels: DEBUG, INFO, WARN, ERROR`);
        process.exit(1);
      }
    }

    // Load environment variables
    log('[DEBUG] Loading environment variables...');
    dotenv.config();
    log('[DEBUG] Environment variables loaded. NODE_ENV:', process.env.NODE_ENV);
    log('[DEBUG] Current log level:', getLogLevel());

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
