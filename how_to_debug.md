<!-- @format -->

# How to Debug the Amazon-Seller MCP Server

This guide explains how to debug the Amazon-Seller MCP server using the MCP Inspector tool.

## Overview

The MCP Inspector is an interactive developer tool for testing and debugging Model Context Protocol servers. It provides a web interface to interact with your MCP server, test tools, inspect resources, and monitor server behavior.

## Current Server Configuration

The `amazon-seller` MCP server is configured in `.mcp.json` as follows:

```json
"amazon-seller": {
  "command": "npm",
  "args": ["start"],
  "cwd": "./AmazonSeller-mcp-server",
  "env": {
    "SP_API_CLIENT_ID": "${SP_API_CLIENT_ID}",
    "SP_API_CLIENT_SECRET": "${SP_API_CLIENT_SECRET}",
    "SP_API_REFRESH_TOKEN": "${SP_API_REFRESH_TOKEN}",
    "SP_API_AWS_ACCESS_KEY": "${SP_API_AWS_ACCESS_KEY}",
    "SP_API_AWS_SECRET_KEY": "${SP_API_AWS_SECRET_KEY}",
    "SP_API_ROLE_ARN": "${SP_API_ROLE_ARN}",
    "SP_API_MARKETPLACE_ID": "${SP_API_MARKETPLACE_ID}",
    "SP_API_REGION": "${SP_API_REGION}"
  }
}
```

## Debugging Commands

### Option 1: Direct MCP Inspector Command

```bash
npx @modelcontextprotocol/inspector \
  --directory ./AmazonSeller-mcp-server \
  node src/index.js
```

### Option 2: With Environment Variables

```bash
cd AmazonSeller-mcp-server && \
SP_API_CLIENT_ID="${SP_API_CLIENT_ID}" \
SP_API_CLIENT_SECRET="${SP_API_CLIENT_SECRET}" \
SP_API_REFRESH_TOKEN="${SP_API_REFRESH_TOKEN}" \
SP_API_AWS_ACCESS_KEY="${SP_API_AWS_ACCESS_KEY}" \
SP_API_AWS_SECRET_KEY="${SP_API_AWS_SECRET_KEY}" \
SP_API_ROLE_ARN="${SP_API_ROLE_ARN}" \
SP_API_MARKETPLACE_ID="${SP_API_MARKETPLACE_ID}" \
SP_API_REGION="${SP_API_REGION}" \
npx @modelcontextprotocol/inspector node src/index.js
```

### Option 3: Using Predefined NPM Script

The package.json includes a predefined inspect script:

```bash
cd AmazonSeller-mcp-server && npm run inspect
```

## Prerequisites

1. **Environment Variables**: Ensure all required Amazon SP-API credentials are set:

   - `SP_API_CLIENT_ID`
   - `SP_API_CLIENT_SECRET`
   - `SP_API_REFRESH_TOKEN`
   - `SP_API_AWS_ACCESS_KEY`
   - `SP_API_AWS_SECRET_KEY`
   - `SP_API_ROLE_ARN`
   - `SP_API_MARKETPLACE_ID`
   - `SP_API_REGION`

2. **Dependencies**: Make sure npm dependencies are installed:
   ```bash
   cd AmazonSeller-mcp-server && npm install
   ```

## Using the Inspector

Once the Inspector starts, it will open a web interface where you can:

### Server Connection Pane

- Verify server connectivity
- Check transport configuration
- Monitor connection status

### Resources Tab

- View available resources
- Inspect resource metadata and MIME types
- Test resource content retrieval
- Test subscription functionality

### Prompts Tab

- Browse available prompt templates
- Test prompts with custom arguments
- Preview generated messages
- Validate prompt schemas

### Tools Tab

- List all available tools
- Examine tool schemas and descriptions
- Test tool execution with custom inputs
- Monitor tool execution results

### Notifications Pane

- View server logs in real-time
- Monitor notifications from the server
- Debug communication issues

## Development Workflow

1. **Start Development**

   - Launch Inspector with the server
   - Verify basic connectivity
   - Check capability negotiation

2. **Iterative Testing**

   - Make server changes
   - Rebuild the server
   - Reconnect the Inspector
   - Test affected features
   - Monitor messages and logs

3. **Test Edge Cases**
   - Test with invalid inputs
   - Test missing prompt arguments
   - Test concurrent operations
   - Verify error handling and responses

## Troubleshooting

- **Connection Issues**: Check that all environment variables are properly set
- **Build Errors**: Ensure `npm install` was run in the AmazonSeller-mcp-server directory
- **API Errors**: Verify Amazon SP-API credentials are valid and have proper permissions
- **Inspector Not Loading**: Check that npx can access the @modelcontextprotocol/inspector package

## Additional Resources

- [MCP Inspector Repository](https://github.com/modelcontextprotocol/inspector)
- [MCP Debugging Guide](https://modelcontextprotocol.io/docs/tools/debugging)
- [Amazon SP-API Documentation](https://developer-docs.amazon.com/sp-api/)
