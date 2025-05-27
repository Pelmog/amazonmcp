# Debug Logging System

The MCP server now uses file-based logging to avoid interfering with the MCP protocol's stdio communication.

## How it works

- All debug output is written to `debug.log` in the project root
- `console.log` and `console.error` are automatically redirected to the log file
- The server's stdout/stderr remain clean for MCP protocol communication

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