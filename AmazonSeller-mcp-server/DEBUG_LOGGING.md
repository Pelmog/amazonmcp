# Debug Logging System

The MCP server now uses file-based logging to avoid interfering with the MCP protocol's stdio communication.

## How it works

- All debug output is written to `debug.log` in the project root
- `console.log` and `console.error` are automatically redirected to the log file
- The server's stdout/stderr remain clean for MCP protocol communication
- **Log levels**: Control the verbosity of logging output

## Log Levels

The logger supports four log levels (in order of verbosity):

1. **DEBUG** (default) - Shows all messages including detailed debug information
2. **INFO** - Shows informational messages, warnings, and errors
3. **WARN** - Shows warnings and errors only
4. **ERROR** - Shows only error messages

## Setting Log Level

### Command Line
```bash
# Run with errors only
node src/index.js --log-level ERROR

# Run with warnings and errors
node src/index.js --log-level WARN

# Or use the short form
node src/index.js -l ERROR
```

### Environment Variable
```bash
export LOG_LEVEL=ERROR
node src/index.js
```

### NPM Scripts
```bash
# Start with errors only (clean log)
npm run start:errors-only

# Start with warnings and errors
npm run start:quiet

# Regular start (all debug messages)
npm start

# Inspect with errors only
npm run inspect:errors-only
```

## Viewing logs

To view debug logs in real-time:

```bash
tail -f debug.log
```

To clear the log file:

```bash
> debug.log
```

## Log format

All log entries include timestamps and are formatted as:
```
[ISO timestamp] [LEVEL] [MODULE] message
```

Example:
```
[2025-05-27T14:30:45.123Z] [DEBUG] [ORDERS] getOrders handler entry
[2025-05-27T14:30:45.124Z] [DEBUG] [AUTH] getAccessToken() called
```

## HTTP Connection Improvements

The HTTP client has been enhanced with:

- **Connection pooling**: Keep-alive connections to reduce latency
- **Timeout configuration**: 30s for API requests, 15s for auth
- **Retry logic**: Automatic retry with exponential backoff for transient errors
- **Better error handling**: Detailed logging of connection issues

## Modules

The logging system is implemented in `src/utils/logger.js` and imported throughout the codebase.