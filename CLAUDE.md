# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Amazon MCP (Model Context Protocol) integration project that provides a complete MCP server for Amazon's Selling Partner API. The actual implementation is contained in the `AmazonSeller-mcp-server` git submodule.

## Commands

### Development Commands
```bash
# Install dependencies
cd AmazonSeller-mcp-server && npm install

# Run the MCP server (stdio transport)
cd AmazonSeller-mcp-server && npm start

# Run in development mode
cd AmazonSeller-mcp-server && node src/index.js
```

### Git Submodule Commands
```bash
# Update submodule to latest
git submodule update --remote AmazonSeller-mcp-server

# Initialize submodules (if cloning fresh)
git submodule update --init --recursive
```

## Architecture

### MCP Server Structure
The project implements a modular MCP server with 12 specialized tool modules covering the complete Amazon SP-API surface:

- **Authentication**: OAuth2 and AWS4 signature handling (`src/utils/auth.js`)
- **API Tools**: Each tool module (`src/tools/*.js`) handles specific SP-API domains:
  - Orders, Inventory, Catalog, Reports, Finance
  - FBA, Feeds, Notifications, Pricing, Listings
  - Seller operations

### Key Components
- **Main Server** (`src/server.js`): MCP server configuration with tool registration
- **Entry Point** (`src/index.js`): Stdio transport setup for MCP communication
- **API Documentation** (`src/resources/api-docs.js`): Comprehensive SP-API reference
- **Authentication Utilities** (`src/utils/auth.js`): OAuth2 and AWS signature generation

### Environment Setup
Copy `.env.example` to `.env` in the AmazonSeller-mcp-server directory and configure:
- `CLIENT_ID`, `CLIENT_SECRET`: Amazon SP-API app credentials
- `REFRESH_TOKEN`: OAuth2 refresh token
- `ACCESS_KEY_ID`, `SECRET_ACCESS_KEY`: AWS IAM credentials
- `MARKETPLACE_ID`: Target marketplace (e.g., ATVPDKIKX0DER for US)

### Tool Architecture
Each tool module exports handlers that:
1. Validate input using Zod schemas
2. Authenticate requests using OAuth2 + AWS4 signatures
3. Make SP-API calls via axios
4. Return structured responses for MCP consumption

The server uses the `@modelcontextprotocol/sdk` framework for MCP protocol implementation.